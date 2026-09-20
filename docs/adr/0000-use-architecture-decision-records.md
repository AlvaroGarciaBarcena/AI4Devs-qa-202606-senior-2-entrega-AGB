# ADR-0000: Usar Architecture Decision Records

## Estado
Aceptado

## Contexto
Este proyecto lleva desde el principio un diario de desarrollo muy completo, [`prompts-AGB.md`](../../entrega-frontend-AGB/prompts-AGB.md): cada rama tiene su sección, con el prompt que la originó, el proceso de investigación y los hallazgos reales verificados con PoC. Es excelente como registro histórico, pero tiene un coste: para saber *qué se decidió* sobre, por ejemplo, la autenticación, hay que leer varias páginas de proceso mezcladas con el resultado. No hay un sitio para consultar solo la decisión final, corta, sin la narrativa completa alrededor.

## Decisión
Añadir `docs/adr/`, con un ADR corto (formato Nygard) por cada decisión de arquitectura real tomada en el proyecto — no por cada rama ni por cada bug corregido, solo por las decisiones donde había más de un camino razonable. Cada ADR enlaza a la sección correspondiente de `prompts-AGB.md` para quien quiera el proceso completo.

## Alternativas consideradas
- **No documentar decisiones aparte, confiar solo en `prompts-AGB.md`**: descartado porque mezclar la decisión con el proceso completo hace lento encontrar "qué se decidió" sin leer todo el contexto.
- **Reemplazar `prompts-AGB.md` por ADRs**: descartado — un ADR no tiene sitio para el proceso de investigación ni los hallazgos reales encontrados por el camino (bugs, PoCs), que sí tienen valor propio como aprendizaje.

## Consecuencias
- Dos documentos con propósitos distintos y complementarios, no uno sustituyendo al otro — hay que mantener la disciplina de que un ADR se queda corto a propósito, sin duplicar el detalle que ya vive en el diario.
- Los ADRs, al ser cortos y sin fecha implícita en el contenido (solo en el nombre del fichero si hiciera falta), son más fáciles de copiar como plantilla a un proyecto futuro que el diario completo.
