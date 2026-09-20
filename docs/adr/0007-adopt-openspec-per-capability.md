# ADR-0007: Adoptar OpenSpec, una spec por capacidad

## Estado
Aceptado

## Contexto
Tras 14 ramas de trabajo documentadas en `prompts-AGB.md`, el proyecto tenía un registro cronológico excelente de *cómo* se construyó, pero ningún documento que respondiera, de forma directa y verificable, *qué hace el sistema hoy* — había que reconstruirlo leyendo el diario entero o el propio código.

## Decisión
Adoptar [OpenSpec](https://github.com/Fission-AI/OpenSpec), con una spec por **capacidad** (`authentication`, `candidate-intake`, `security-hardening`...), no una por rama — varias ramas pueden tocar la misma capacidad, y una capacidad puede construirse a lo largo de varias ramas. Cada requisito lleva una línea de trazabilidad (`_Rama: \`nombre-AGB\` (commit \`hash\`)_`) apuntando a dónde se implementó de verdad.

## Alternativas consideradas
- **Una spec por rama**: rechazado — no refleja cómo se organiza el sistema realmente (por capacidad de negocio), solo cómo se construyó cronológicamente, que es justo lo que `prompts-AGB.md` ya cubre.
- **Excluir las ramas de solo herramienta de desarrollo** (Vite, tests, migración de router) de OpenSpec, por no ser "una función que alguien use": postura inicial, corregida tras la observación del usuario de que "el cambio de cómo está construido el sistema es un cambio real" — se añade la capacidad `developer-tooling` para cubrir justo eso.
- **Escenarios solo con WHEN/THEN** (sin GIVEN): postura inicial, corregida tras la corrección directa del usuario — el proyecto se ha desarrollado en BDD de principio a fin, así que el GIVEN no es opcional aquí. Se forkeó el esquema de OpenSpec (`openspec/schemas/spec-driven-bdd/`) para hacerlo obligatorio en este proyecto.

## Consecuencias
- 11 capacidades, ~41 requisitos, 56 escenarios GIVEN/WHEN/THEN completos, cada uno trazado a su rama/commit real — verificable con `openspec validate --specs --strict`.
- Cuando una rama posterior corrige algo que una rama anterior documentó como ya resuelto (p. ej. la validación de contenido subido, ver `prompts-AGB.md` §3.27.1), la línea de trazabilidad se actualiza para apuntar a quien lo arregló de verdad, no a quien solo dejó constancia del hallazgo — la trazabilidad manda sobre la cronología.

Más contexto: [`prompts-AGB.md` §3.24](../../entrega-frontend-AGB/prompts-AGB.md#324-adopción-de-openspec-openspec-adoption-agb).
