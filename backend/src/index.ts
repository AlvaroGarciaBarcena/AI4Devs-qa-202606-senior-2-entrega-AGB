import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import authRoutes from './routes/authRoutes';
import { uploadFile } from './application/services/fileUploadService';
import { requireAuth } from './presentation/middleware/authMiddleware';
import { AuthTokenPayload } from './application/services/authService';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { buildCorsOptions } from './corsOptions';
import { getListeningAddresses } from './networkAddresses';
import { getGitInfo } from './gitInfo';

// Extender la interfaz Request para incluir prisma y, tras pasar por
// requireAuth, el empleado autenticado (payload del JWT: id, role,
// companyId — nunca el hash de la contraseña).
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      employee?: AuthTokenPayload;
    }
  }
}

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default app;

// Cabeceras de seguridad estándar (X-Content-Type-Options, evita MIME-sniffing;
// CSP/HSTS/X-Frame-Options por defecto, etc.). No hay vistas HTML servidas por
// este backend (API pura), por lo que la CSP por defecto de helmet no choca
// con nada existente.
app.use(helmet());

// Límite de peticiones por IP: sin esto, cualquier ruta (en particular
// POST /upload, que acepta hasta 10MB por petición, y POST /candidates)
// puede saturarse por fuerza bruta o denegación de servicio, ya que la API
// no requiere autenticación. 300 peticiones/15 min es holgado para un uso
// normal del formulario y del panel de reclutador.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Límite específico y más estricto para el login: sin cuentas que se
// bloqueen tras varios intentos fallidos (no hay ese concepto en el
// modelo Employee), este es el único freno real contra probar
// contraseñas por fuerza bruta contra un email conocido.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.' },
});

// Middleware para parsear JSON. Asegúrate de que esto esté antes de tus rutas.
app.use(express.json());

// Middleware para adjuntar prisma al objeto de solicitud
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Orígenes permitidos, configurables por CORS_ORIGINS (lista separada por
// comas) -- por defecto solo http://localhost:3000, igual que antes. Para
// acceder desde otro equipo de la red local, añade su origen real (p. ej.
// CORS_ORIGINS=http://localhost:3000,http://192.168.1.50:3000) en
// backend/.env; ver corsOptions.ts para el porqué.
app.use(cors(buildCorsOptions(process.env.CORS_ORIGINS)));

// Middleware de logging de peticiones. Debe ir antes de las rutas para
// registrar TODAS las peticiones entrantes (antes vivía después de las
// rutas y nunca llegaba a ejecutarse para /candidates, /upload o /position,
// ya que esos handlers ya habían respondido la petición).
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de login, sin autenticar (es la que la concede) pero con su propio
// límite de intentos.
app.use('/auth', loginLimiter, authRoutes);

// A partir de aquí, toda ruta exige un JWT válido (ver
// presentation/middleware/authMiddleware.ts) — antes de esta rama,
// cualquiera que alcanzara el puerto del backend podía leer y escribir
// datos de candidatos sin identificarse (ver prompts-AGB.md, sección
// 3.17.2).
app.use('/candidates', requireAuth, candidateRoutes);

// Route for file uploads
app.post('/upload', requireAuth, uploadFile);

// Route to get candidates by position
app.use('/position', requireAuth, positionRoutes);

const port = 3010;

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

// Sin autenticar a propósito: sirve para comprobar, antes incluso de
// intentar iniciar sesión, qué commit/rama está sirviendo de verdad el
// backend que responde en este puerto -- hallazgo real (prompts-AGB.md,
// sección 3.65): más de una vez, el backend en marcha resultó ser el de
// otro repo/rama, mismo puerto, sin ningún aviso. Usado por
// e2e/global-setup.ts antes de arrancar la suite.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', git: getGitInfo() });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain');
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}, reachable at:`);
  getListeningAddresses(port).forEach((address) => console.log(`  ${address}`));

  const gitInfo = getGitInfo();
  if (gitInfo) {
    console.log(`  commit ${gitInfo.commit.slice(0, 7)} (rama ${gitInfo.branch})`);
  }
});
