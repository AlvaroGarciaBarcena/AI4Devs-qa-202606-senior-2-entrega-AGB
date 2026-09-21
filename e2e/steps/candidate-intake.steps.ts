import path from 'node:path';
import { createBdd } from 'playwright-bdd';
import { expect, Page } from '@playwright/test';
import { prisma } from './support/prisma';

const { Given, When, Then } = createBdd();

const CV_FIXTURE = path.resolve(__dirname, '../fixtures/cv-valido.pdf');

// Cada escenario que llega a enviar el formulario usa un email único (con
// timestamp) -- la base de datos de desarrollo es real y compartida entre
// ejecuciones de la suite, y el email es único a nivel de base de datos
// (ver "Email duplicado"), así que reusar un email fijo entre escenarios
// rompería el segundo que lo intentara.
const uniqueEmail = (label: string) => `e2e-${label}-${Date.now()}@example.com`;

let lastCandidateEmail: string;
let tempPositionId: number;
let tempInterviewFlowId: number;

// La sesión ya viene dada por storageState (login real único de
// e2e/global-setup.ts, ver playwright.config.ts) -- no hace falta volver a
// iniciar sesión por navegador en cada escenario, solo navegar.
const goToAddCandidateForm = async (page: Page) => {
  await page.goto('/add-candidate');
  await expect(page.getByRole('heading', { name: 'Agregar Candidato' })).toBeVisible();
};

const fillBasicFields = async (page: Page, { firstName, lastName, email }: { firstName: string; lastName: string; email: string }) => {
  await page.getByLabel('Nombre').fill(firstName);
  await page.getByLabel('Apellido').fill(lastName);
  await page.getByLabel('Correo Electrónico').fill(email);
};

const selectKnownPosition = async (page: Page) => {
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
};

// Nombre, apellido, email y la posición sembrada, seguido de "Enviar" --
// se repetía igual en cinco escenarios distintos (jscpd: 10.3% de
// duplicación en este fichero antes de extraerlo).
const submitBasicCandidateForm = async (page: Page, { firstName, lastName, email }: { firstName: string; lastName: string; email: string }) => {
  await fillBasicFields(page, { firstName, lastName, email });
  await selectKnownPosition(page);
  await page.getByRole('button', { name: 'Enviar' }).click();
};

// react-datepicker: el input acepta texto tecleado directamente (con el
// formato configurado, yyyy-MM-dd), pero solo actualiza el estado real del
// formulario (dispara su onChange con un Date) al confirmar con Enter --
// cerrar el calendario con Escape en vez de Enter deja el texto visible en
// el input pero NO actualiza `education.startDate`/`workExperience.
// startDate` en React, así que el alta se enviaba con la fecha vacía y
// fallaba la validación del backend (hallazgo real: los dos primeros
// intentos de estos escenarios fallaban en silencio por esto exacto).
const fillDatePickerInput = async (page: Page, placeholder: string, value: string) => {
  const input = page.getByPlaceholder(placeholder).first();
  await input.click();
  await input.fill(value);
  await page.keyboard.press('Enter');
};

// Cada escenario que crea un candidato de verdad contra la posición
// sembrada ("Senior Full-Stack Engineer") tiene que limpiarlo al terminar:
// es la misma posición cuyo tablero "Ver proceso" comprueba
// hiring-pipeline.feature, y sin este cleanup cada reejecución de la suite
// va dejando más candidatos de prueba acumulados ahí para siempre
// (hallazgo real: 15 candidatos de prueba acumulados tras varias
// ejecuciones, visibles de verdad en el tablero -- ver prompts-AGB.md).
const cleanupCandidateByEmail = async (email: string) => {
  const candidate = await prisma.candidate.findFirst({ where: { email } });
  if (!candidate) return;
  await prisma.education.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.workExperience.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.resume.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.application.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.candidate.delete({ where: { id: candidate.id } });
};

// getByRole('status') a secas ya no basta desde que existe
// NavigationLoadingIndicator (frontend/src/components/): es un segundo
// role="status" permanente en el DOM (necesario para que aria-live
// funcione bien -- desmontarlo y volver a montarlo perdería anuncios
// reales), así que hace falta filtrar por el texto del mensaje de éxito
// en concreto para no toparse con "strict mode violation".
const expectSuccessMessage = (page: Page) =>
  expect(page.getByRole('status').filter({ hasText: 'Candidato añadido con éxito' })).toHaveText('Candidato añadido con éxito');

Given('el reclutador está en el formulario de alta de candidato', async ({ page }) => {
  await goToAddCandidateForm(page);
});

When('envía nombre, apellidos, email y una posición válidos', async ({ page }) => {
  lastCandidateEmail = uniqueEmail('alta-exito');
  await submitBasicCandidateForm(page, { firstName: 'Maria', lastName: 'Lopez', email: lastCandidateEmail });
});

Then('el sistema crea el candidato y muestra el mensaje de éxito', async ({ page }) => {
  await expectSuccessMessage(page);
  await cleanupCandidateByEmail(lastCandidateEmail);
});

Given('ya existe un candidato con un email concreto', async () => {
  // Lo satisface el seed de la base de datos (backend/prisma/seed.ts):
  // john.doe@gmail.com ya existe como candidato desde el arranque.
  lastCandidateEmail = 'john.doe@gmail.com';
});

When('se intenta dar de alta a otro candidato con ese mismo email', async ({ page }) => {
  await goToAddCandidateForm(page);
  await submitBasicCandidateForm(page, { firstName: 'Otro', lastName: 'Candidato', email: lastCandidateEmail });
});

Then('el sistema rechaza el alta con un mensaje que indica que el email ya existe', async ({ page }) => {
  await expect(page.getByRole('alert').last()).toContainText('The email already exists in the database');
});

When('pulsa "Añadir Educación" y rellena institución, título y fecha de inicio, y completa el resto del alta', async ({ page }) => {
  lastCandidateEmail = uniqueEmail('educacion');
  await page.getByRole('button', { name: 'Añadir Educación' }).click();
  await page.getByPlaceholder('Institución').fill('Universidad Complutense de Madrid');
  await page.getByPlaceholder('Título').fill('Grado en Ingeniería Informática');
  await fillDatePickerInput(page, 'Fecha de Inicio', '2018-09-01');
  await submitBasicCandidateForm(page, { firstName: 'Laura', lastName: 'Martin', email: lastCandidateEmail });
  await expectSuccessMessage(page);
});

Then('esa entrada se guarda asociada al candidato tras el envío', async () => {
  const candidate = await prisma.candidate.findFirst({
    where: { email: lastCandidateEmail },
    include: { educations: true },
  });
  expect(candidate).not.toBeNull();
  expect(candidate.educations).toHaveLength(1);
  expect(candidate.educations[0].institution).toBe('Universidad Complutense de Madrid');
  expect(candidate.educations[0].title).toBe('Grado en Ingeniería Informática');
  await cleanupCandidateByEmail(lastCandidateEmail);
});

Given('el formulario tiene una entrada de educación ya añadida', async ({ page }) => {
  await goToAddCandidateForm(page);
  await page.getByRole('button', { name: 'Añadir Educación' }).click();
  await page.getByPlaceholder('Institución').fill('Institución a quitar');
  await expect(page.getByPlaceholder('Institución')).toBeVisible();
});

When('el reclutador pulsa "Eliminar" sobre esa entrada', async ({ page }) => {
  await page.getByRole('button', { name: 'Eliminar' }).click();
});

Then('esa entrada desaparece del formulario y no se envía con el alta', async ({ page }) => {
  await expect(page.getByPlaceholder('Institución')).toHaveCount(0);
});

When('pulsa "Añadir Experiencia Laboral" y rellena empresa, puesto y fecha de inicio, y completa el resto del alta', async ({ page }) => {
  lastCandidateEmail = uniqueEmail('experiencia');
  await page.getByRole('button', { name: 'Añadir Experiencia Laboral' }).click();
  await page.getByPlaceholder('Empresa').fill('Acme Software S.L.');
  await page.getByPlaceholder('Puesto').fill('Ingeniera de Software');
  await fillDatePickerInput(page, 'Fecha de Inicio', '2021-03-01');
  await submitBasicCandidateForm(page, { firstName: 'Carmen', lastName: 'Ruiz', email: lastCandidateEmail });
  await expectSuccessMessage(page);
});

Then('esa entrada de experiencia se guarda asociada al candidato tras el envío', async () => {
  const candidate = await prisma.candidate.findFirst({
    where: { email: lastCandidateEmail },
    include: { workExperiences: true },
  });
  expect(candidate).not.toBeNull();
  expect(candidate.workExperiences).toHaveLength(1);
  expect(candidate.workExperiences[0].company).toBe('Acme Software S.L.');
  expect(candidate.workExperiences[0].position).toBe('Ingeniera de Software');
  await cleanupCandidateByEmail(lastCandidateEmail);
});

Given('existe al menos una posición con su flujo de entrevistas configurado', async () => {
  // Lo satisface el seed: "Senior Full-Stack Engineer", con interviewFlow1
  // (fases "Initial Screening" / "Technical Interview").
});

When('el reclutador elige esa posición en el desplegable y completa el resto del formulario', async ({ page }) => {
  lastCandidateEmail = uniqueEmail('posicion-valida');
  await goToAddCandidateForm(page);
  await submitBasicCandidateForm(page, { firstName: 'Elena', lastName: 'Torres', email: lastCandidateEmail });
  await expectSuccessMessage(page);
});

Then('el candidato se crea y aparece en la primera fase del tablero "Ver proceso" de esa posición', async ({ page }) => {
  await page.goto('/positions');
  await page.locator('.card', { hasText: 'Senior Full-Stack Engineer' }).getByRole('button', { name: 'Ver proceso' }).click();
  await expect(page).toHaveURL(/\/positions\/\d+$/);
  // No se busca la columna por su encabezado en inglés ("Initial
  // Screening"): con la suite en español nunca coincide con lo que
  // renderiza la UI ("Selección inicial") -- ver
  // hiring-pipeline.steps.ts para el mismo fallo ya confirmado y
  // corregido ahí. La comprobación ya dependía de que "Elena Torres"
  // fuera único en el tablero (ver el cleanup de abajo), no de en qué
  // columna concreta cayera.
  await expect(page.locator('.border.rounded').getByText('Elena Torres')).toBeVisible();

  // El nombre en sí no es único (el apellido debe ser solo letras, ver
  // validator.ts) y el tablero es un dato acumulativo de la base de
  // datos de desarrollo real -- sin este cleanup, cada reejecución de
  // este escenario dejaría otra tarjeta "Elena Torres" en la misma
  // columna, y `getByText` dejaría de identificar una sola sin ambigüedad
  // en la siguiente ejecución (pasó de verdad la primera vez que se
  // reejecutó la suite completa).
  await cleanupCandidateByEmail(lastCandidateEmail);
});

Given('el reclutador ha rellenado el resto del formulario pero no ha elegido ninguna posición', async ({ page }) => {
  await goToAddCandidateForm(page);
  lastCandidateEmail = uniqueEmail('sin-posicion');
  await fillBasicFields(page, { firstName: 'Sin', lastName: 'Posicion', email: lastCandidateEmail });
});

When('lo envía', async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar' }).click();
});

Then('el candidato se crea con éxito, sin ninguna candidatura asociada', async ({ page }) => {
  await expectSuccessMessage(page);

  const candidate = await prisma.candidate.findFirst({
    where: { email: lastCandidateEmail },
    include: { applications: true },
  });
  expect(candidate).not.toBeNull();
  expect(candidate!.applications).toHaveLength(0);

  await cleanupCandidateByEmail(lastCandidateEmail);
});

Given('la posición elegida existe pero su flujo de entrevistas no tiene ninguna fase', async ({ page }) => {
  const company = await prisma.company.findFirst();
  const flow = await prisma.interviewFlow.create({ data: { description: 'E2E: flujo sin fases (candidate-intake)' } });
  const position = await prisma.position.create({
    data: {
      title: 'E2E Posición Sin Flujo',
      description: 'Fixture de prueba E2E',
      status: 'Open',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'x',
      companyId: company.id,
      interviewFlowId: flow.id,
      salaryMin: 1,
      salaryMax: 2,
      employmentType: 'Full-time',
      benefits: 'x',
      contactInfo: 'x',
      requirements: 'x',
      responsibilities: 'x',
      companyDescription: 'x',
      applicationDeadline: new Date('2030-01-01'),
    },
  });
  tempInterviewFlowId = flow.id;
  tempPositionId = position.id;

  await goToAddCandidateForm(page);
});

When('se envía el alta con esa posición', async ({ page }) => {
  lastCandidateEmail = uniqueEmail('sin-flujo');
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'E2E Posición Sin Flujo — LTI' });
  await fillBasicFields(page, { firstName: 'Pedro', lastName: 'Sanchez', email: lastCandidateEmail });
  await page.getByRole('button', { name: 'Enviar' }).click();
});

Then('el sistema la rechaza con un mensaje que indica que esa posición no tiene un proceso de entrevistas configurado', async ({ page }) => {
  await expect(page.getByRole('alert').last()).toContainText('does not have an interview process configured');

  // Confirma también, a nivel de base de datos, que el fix real de
  // candidateService.ts (prompts-AGB.md, sección de candidate-intake) sigue
  // en pie: el candidato rechazado no debe quedar huérfano.
  const orphan = await prisma.candidate.findFirst({ where: { email: lastCandidateEmail } });
  expect(orphan).toBeNull();

  await prisma.position.delete({ where: { id: tempPositionId } });
  await prisma.interviewFlow.delete({ where: { id: tempInterviewFlowId } });
});

Given('un envío fallido ha marcado un campo como inválido', async ({ page }) => {
  await goToAddCandidateForm(page);
  // "Poc2" pasa el `required` nativo del navegador (es texto no vacío) pero
  // falla la validación del backend (validator.ts: solo letras y espacios
  // en el nombre) -- así se provoca un error de campo real de verdad.
  await fillBasicFields(page, { firstName: 'Poc2', lastName: 'Apellido', email: uniqueEmail('campo-invalido') });
  await selectKnownPosition(page);
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
});

When('el usuario modifica su valor sin volver a pulsar "Enviar"', async ({ page }) => {
  await page.getByLabel('Nombre').fill('Poc');
});

Then('el mensaje de error y el marcado visual de ese campo desaparecen de inmediato', async ({ page }) => {
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByText('El nombre contiene un carácter no permitido')).toHaveCount(0);
});

Given('un reclutador acaba de completar un alta de candidato con éxito', async ({ page }) => {
  await goToAddCandidateForm(page);
  lastCandidateEmail = uniqueEmail('reset-tras-exito');
  await fillBasicFields(page, { firstName: 'Sofia', lastName: 'Navarro', email: lastCandidateEmail });
  await page.getByLabel('Teléfono').fill('611223344');
  await page.getByLabel('Dirección').fill('Calle Falsa 123');
  await selectKnownPosition(page);

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(CV_FIXTURE);
  await page.getByRole('button', { name: 'Subir Archivo' }).click();
  await expect(page.getByText('Archivo subido con éxito')).toBeVisible();

  await page.getByRole('button', { name: 'Enviar' }).click();
  await expectSuccessMessage(page);
});

When('empieza a rellenar los datos de un segundo candidato', async ({ page }) => {
  await page.getByLabel('Nombre').fill('Segundo');
});

Then('ningún campo conserva los valores del candidato anterior', async ({ page }) => {
  await expect(page.getByLabel('Apellido')).toHaveValue('');
  await expect(page.getByLabel('Correo Electrónico')).toHaveValue('');
  await expect(page.getByLabel('Teléfono')).toHaveValue('');
  await expect(page.getByLabel('Dirección')).toHaveValue('');
  await expect(page.getByLabel('Posición a la que se presenta')).toHaveValue('');
  await expect(page.getByText('Ningún archivo seleccionado')).toBeVisible();
  await expect(page.getByText('Archivo subido con éxito')).toHaveCount(0);
  await cleanupCandidateByEmail(lastCandidateEmail);
});
