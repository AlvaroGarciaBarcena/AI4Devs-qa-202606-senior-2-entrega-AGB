# Prompts utilizados — AGB

1. "Analiza el repositorio AI4Devs-qa-202606-senior-2 y confirma si el proyecto ya cumple los requisitos de este segundo ejercicio (mover candidatos por drag-and-drop y cobertura con Playwright)."

2. "Usa la rama final de la entrega del primer ejercicio como base (`main`) para las ramas nuevas de este segundo ejercicio."

3. "Confirma qué rama aglutina todo el trabajo del primer ejercicio antes de usarla como base."

4. "Forkea el repositorio de QA y publica esa rama como el `main` de ese fork. Renombra la rama para que su nombre refleje que aglutina el trabajo de la Lección 11, no solo el último hallazgo de seguridad."

5. "Haz todo el trabajo en local antes de tocar GitHub."

6. "Antes de escribir código, revisa con atención qué exige entregar el README del ejercicio de QA."

7. "Evalúa qué problemas generaría mover la suite E2E de la raíz (`/e2e`) a `/frontend/tests/e2e/`."

8. "Mantén `/e2e` sin tocar y crea `/frontend/tests/e2e/` aparte, solo con los tests que exige el ejercicio de QA."

9. "Indica cómo limpiar manualmente los candidatos de prueba huérfanos ('Nuevo Candidato') que quedaron de una ejecución anterior."

10. "No borres al candidato 'Nico alaslla' -- es una prueba real, no un huérfano. Confirma que los cambios actuales no lo afectan."

11. "Investiga qué causa la lentitud puntual del backend local y cómo optimizarla."

12. "No subas ningún timeout de Playwright. Documenta el caso y el análisis para no repetirlo si vuelve a pasar."

13. "Confirma qué rama es la del renombrado y si sigue documentada tras separar los ficheros de este ejercicio."

14. "Reescribe el fichero de prompts como instrucciones precisas y concisas dirigidas a ti, no como la narrativa completa del proceso -- así es como se evaluará el ejercicio."

15. "Confirma dónde guardaste la descripción del PR."

16. "Guarda la descripción del PR en la carpeta `prompts` del clon local de QA."

17. "Comprueba y explica el aviso de GitHub de que la rama `main` del repo privado no está protegida."

18. "Evalúa si conviene traer al repo de frontend el mismo test que ahora consulta la API en vez de asumir la fase del candidato."

19. "Arregla `hiring-pipeline.steps.ts` (el test ya existente con el problema real) en vez de copiar `position.spec.ts`."

20. "Reduce la duplicación de código de `candidate-intake.steps.ts` (10,3%)."

21. "Reduce también la duplicación de `positionController.ts` (23,6%) y `positionController.test.ts` (13,7%) mientras se espera al limitador."

22. "Verifica qué ficheros cambian entre el repo local de frontend y el de QA antes de sincronizar."

23. "Sube estos arreglos a la entrega del primer ejercicio y deja el repo local sincronizado con el remoto."

24. "Lleva estos mismos arreglos también al repo local de QA, para que parta de la misma base."

25. "Documenta en el repo de QA la necesidad de comprobar que no haya dos backends de ramas distintas respondiendo en el mismo puerto."

26. "Implementa esa comprobación, y además crea un hook que la ejecute automáticamente al lanzar la suite."

27. "Revisa por qué han aparecido candidaturas y posiciones de prueba visibles en la propia aplicación."

28. "Comitea esta versión también al repo remoto de QA."

29. "Espera, falta una cosa antes de continuar."

30. "Actualiza `/prompts/prompts-AGB.md` con los prompts de las últimas horas, en el mismo formato corto que los anteriores."
