import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { prisma } from './support/prisma';

const { Given, When, Then } = createBdd();

const uniqueEmail = (label: string) => `e2e-edit-${label}-${Date.now()}@example.com`;

let tempCandidateId: number;
let tempCandidateEmail: string;

Given('un candidato existente', async () => {
  tempCandidateEmail = uniqueEmail('datos-personales');
  const candidate = await prisma.candidate.create({
    data: { firstName: 'Editable', lastName: 'DePrueba', email: tempCandidateEmail, phone: '600000000' },
  });
  tempCandidateId = candidate.id;
});

When('un reclutador accede a su edición, cambia su teléfono y guarda', async ({ page }) => {
  await page.goto(`/candidates/${tempCandidateId}/edit`);
  await expect(page.getByRole('heading', { name: 'Editar Candidato' })).toBeVisible();
  await expect(page.getByLabel('Nombre')).toHaveValue('Editable');

  await page.getByLabel('Teléfono').fill('');
  await page.getByLabel('Teléfono').fill('611223344');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Candidato actualizado con éxito' })).toBeVisible();
});

Then('el cambio se guarda y se refleja al volver a cargar sus datos', async ({ page }) => {
  await page.reload();
  await expect(page.getByLabel('Teléfono')).toHaveValue('611223344');

  const candidate = await prisma.candidate.findUnique({ where: { id: tempCandidateId } });
  expect(candidate?.phone).toBe('611223344');

  await prisma.candidate.delete({ where: { id: tempCandidateId } });
});

Given('un candidato sin candidatura, y una posición con su flujo de entrevistas configurado', async () => {
  // La posición la satisface el seed ("Senior Full-Stack Engineer");
  // solo hace falta crear el candidato sin ninguna Application.
  tempCandidateEmail = uniqueEmail('asignar-posicion');
  const candidate = await prisma.candidate.create({
    data: { firstName: 'Asignable', lastName: 'DePrueba', email: tempCandidateEmail },
  });
  tempCandidateId = candidate.id;
});

When('un reclutador edita ese candidato y le asigna esa posición', async ({ page }) => {
  await page.goto(`/candidates/${tempCandidateId}/edit`);
  await expect(page.getByLabel('Nombre')).toHaveValue('Asignable');

  await page.getByLabel(/Posición a la que se presenta/).selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Candidato actualizado con éxito' })).toBeVisible();
});

Then('el candidato aparece en la primera fase del tablero de esa posición, y deja de aparecer en el listado de candidatos sin asignar', async ({ page }) => {
  await page.goto('/positions');
  await page.locator('.card', { hasText: 'Senior Full-Stack Engineer' }).getByRole('button', { name: 'Ver proceso' }).click();
  // No se busca la columna por su encabezado en inglés ("Initial
  // Screening"): con la suite en español nunca coincide con lo que
  // renderiza la UI ("Selección inicial") -- ver hiring-pipeline.steps.ts
  // para el mismo fallo ya confirmado y corregido ahí. Como el nombre
  // de este candidato es único, basta con que su ficha exista en
  // alguna columna.
  await expect(page.locator('.border.rounded .card', { hasText: 'Asignable DePrueba' })).toBeVisible();

  await page.goto('/candidates/unassigned');
  await expect(page.getByRole('cell', { name: 'Asignable DePrueba' })).toHaveCount(0);

  const candidate = await prisma.candidate.findFirst({ where: { email: tempCandidateEmail } });
  await prisma.application.deleteMany({ where: { candidateId: candidate!.id } });
  await prisma.candidate.delete({ where: { id: candidate!.id } });
});

Given('un candidato con una candidatura ya asignada', async () => {
  tempCandidateEmail = uniqueEmail('posicion-bloqueada');
  const position = await prisma.position.findFirstOrThrow({ where: { title: 'Senior Full-Stack Engineer' } });
  const firstStep = await prisma.interviewStep.findFirstOrThrow({
    where: { interviewFlowId: position.interviewFlowId },
    orderBy: { orderIndex: 'asc' },
  });
  const candidate = await prisma.candidate.create({
    data: { firstName: 'YaAsignado', lastName: 'DePrueba', email: tempCandidateEmail },
  });
  tempCandidateId = candidate.id;
  await prisma.application.create({
    data: { positionId: position.id, candidateId: candidate.id, applicationDate: new Date(), currentInterviewStep: firstStep.id },
  });
});

When('un reclutador accede a su edición', async ({ page }) => {
  await page.goto(`/candidates/${tempCandidateId}/edit`);
  await expect(page.getByLabel('Nombre')).toHaveValue('YaAsignado');
});

Then('el desplegable de posición aparece deshabilitado, con una nota explicando que no se puede cambiar desde ahí', async ({ page }) => {
  await expect(page.getByLabel(/Posición a la que se presenta/)).toBeDisabled();
  await expect(page.getByText('Ya tiene una candidatura asignada; no se puede cambiar la posición desde aquí.')).toBeVisible();

  await prisma.application.deleteMany({ where: { candidateId: tempCandidateId } });
  await prisma.candidate.delete({ where: { id: tempCandidateId } });
});
