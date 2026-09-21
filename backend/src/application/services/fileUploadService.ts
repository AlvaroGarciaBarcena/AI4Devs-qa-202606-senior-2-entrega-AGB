import multer from 'multer';
import { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';

// El Content-Type de multer/fileFilter lo declara quien sube el fichero --no
// es de fiar-- así que la lista real de tipos permitidos vive aquí, para
// compararla contra el magic number leído del contenido ya guardado en
// disco, no contra lo que diga la petición.
const ALLOWED_CONTENT_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// Antes se usaba una ruta relativa ('../uploads/'), que dependía del cwd desde
// el que se lanzara el proceso de node y fallaba con ENOENT si el directorio
// no existía. Se ancla al cwd del proceso backend y se crea si hace falta.
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        // file.originalname lo controla quien sube el archivo (es el nombre
        // que traiga el multipart/form-data) y multer/busboy no garantizan
        // en todas sus versiones que esté libre de componentes de ruta
        // (`../`, `/`). path.basename() se queda solo con el nombre de
        // fichero final, para que la ruta de escritura no pueda salir nunca
        // de `uploadDir` sea cual sea el valor recibido.
        const safeOriginalName = path.basename(file.originalname);
        cb(null, uniqueSuffix + '-' + safeOriginalName);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB
    },
    fileFilter: fileFilter
});

export const uploadFile = (req: Request, res: Response) => {
    const uploader = upload.single('file');
    uploader(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            // Manejo de errores específicos de Multer
            return res.status(500).json({ error: err.message });
        } else if (err) {
            // Otros errores posibles
            return res.status(500).json({ error: err.message });
        }

        // Verificar si el archivo fue rechazado por el filtro de archivos
        if (!req.file) {
            return res.status(400).json({ error: 'Invalid file type, only PDF and DOCX are allowed!' });
        }

        // El fileFilter de multer solo descarta por Content-Type declarado
        // (no puede hacer más: se ejecuta mientras el archivo aún se está
        // subiendo, sin contenido todavía disponible). Aquí, con el archivo
        // ya en disco, se lee su magic number real y se compara contra los
        // tipos permitidos -- así un .txt renombrado a .pdf con
        // Content-Type: application/pdf ya no pasa.
        // file-type es un paquete puramente ESM (>=17) -- este backend
        // compila a CommonJS, así que se carga con import() dinámico en vez
        // de un import estático, que TypeScript reescribiría a un require()
        // que fallaría contra un paquete sin export CommonJS. La resolución
        // de módulos de este tsconfig (moduleResolution por defecto para
        // module: commonjs) tampoco encuentra los tipos de un paquete
        // solo-ESM -- funciona en runtime (Node sí resuelve import()
        // dinámico contra ESM), pero `tsc` real lo rechaza con TS2307
        // (hallazgo real: nunca se había notado porque ts-node-dev corre
        // en --transpile-only, sin comprobar tipos). @ts-expect-error en
        // vez de tocar moduleResolution del proyecto entero por un único
        // import.
        // @ts-expect-error TS2307: file-type es ESM-only, ver comentario de arriba
        const { fileTypeFromFile } = await import('file-type');
        const detected = await fileTypeFromFile(req.file.path);
        if (!detected || !ALLOWED_CONTENT_TYPES.has(detected.mime)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid file type, only PDF and DOCX are allowed!' });
        }

        // Si todo está bien, proceder a responder con la ruta del archivo y el tipo de archivo
        res.status(200).json({
            filePath: req.file.path,
            fileType: detected.mime  // El tipo detectado del contenido, no el declarado por el cliente
        });
    });
};