import React, { useRef } from 'react';
import { Row, Col, Button, FormControl } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import ReactDatePickerModule from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// El interop CJS→ESM del pre-bundler de dependencias de Vite envuelve dos
// veces el export por defecto de react-datepicker@6.9.0 (el paquete no
// tiene un único `module.exports =`, solo `exports.default = DatePicker`
// junto a otros exports nombrados): `import DatePicker from
// 'react-datepicker'` acaba trayendo el objeto de módulo entero en vez del
// propio componente, y React lo rechaza con "Element type is invalid".
// Se desenvuelve a mano por si acaso, sin depender de que el bundler lo
// resuelva bien.
const DatePicker = ReactDatePickerModule.default || ReactDatePickerModule;

// Componente genérico, sin nada específico de este proyecto: el
// historial profesional de una persona -- educación y experiencia
// laboral, cada una una lista de entradas que se pueden añadir y quitar
// -- es un bloque reutilizable en cualquier proyecto que gestione un CV
// o currículum (este ATS, un portal de empleo, un onboarding de RRHH...).
//
// A diferencia de PersonalDataFields (campos sueltos), aquí SÍ vive la
// lógica de "añadir/quitar/editar una entrada" dentro del propio
// componente -- son varias listas con su propia interacción, y exponer
// esa lógica entera al padre obligaría a reimplementarla en cada
// proyecto que lo use. Sigue siendo controlado hacia fuera: los arrays
// vienen por prop y cualquier cambio se reporta por
// `onEducationsChange`/`onWorkExperiencesChange`, nunca se guarda estado
// propio de los datos en sí. `onFieldChanged(section, index, field)` es
// un enganche opcional para que quien lo use pueda reaccionar a un campo
// concreto (p. ej. limpiar un error de validación de ese campo) sin que
// este componente sepa nada de cómo se validan esos datos.
const EMPTY_EDUCATION = { institution: '', title: '', startDate: '', endDate: '' };
const EMPTY_WORK_EXPERIENCE = { company: '', position: '', description: '', startDate: '', endDate: '' };

// Las entradas de educación/experiencia no traen ningún id propio (ver
// candidateFromExisting en AddCandidateForm.jsx: se quita a propósito al
// cargar un candidato existente, para no arrastrar el id de la BD en un
// formulario que sustituye la lista entera al guardar). Sin una clave
// estable, usar el índice como `key` de React reutiliza el nodo DOM
// equivocado al quitar una entrada que no sea la última -- el DatePicker
// siguiente hereda el estado interno (abierto/foco) del que ocupaba antes
// esa posición. Este hook genera una clave local por entrada, ajena a los
// datos del formulario (nunca se manda al padre): se deriva durante el
// propio render (patrón "ajustar estado al cambiar una prop" de los docs
// de React, con un ref en vez de useState -- no hace falta un
// re-render aparte solo para esto), y se regenera entera cuando la lista
// cambia de longitud desde fuera (cargar un candidato existente, o el
// reseteo a vacío tras guardar). Añadir/quitar una entrada actualiza el
// ref directamente en el mismo evento que ya dispara su propio re-render
// (vía onEducationsChange/onWorkExperiencesChange), así que no hace falta
// nada más para que se refleje.
const useEntryKeys = (list) => {
    const nextId = useRef(0);
    const keysRef = useRef(null);

    if (keysRef.current === null || keysRef.current.length !== list.length) {
        keysRef.current = list.map(() => nextId.current++);
    }

    const addKey = () => {
        keysRef.current = [...keysRef.current, nextId.current++];
    };
    const removeKeyAt = (index) => {
        keysRef.current = keysRef.current.filter((_key, keyIndex) => keyIndex !== index);
    };

    return [keysRef.current, addKey, removeKeyAt];
};

const WorkHistoryFields = ({
    educations,
    workExperiences,
    onEducationsChange,
    onWorkExperiencesChange,
    onFieldChanged,
    labels,
}) => {
    const [educationKeys, addEducationKey, removeEducationKeyAt] = useEntryKeys(educations);
    const [workExperienceKeys, addWorkExperienceKey, removeWorkExperienceKeyAt] = useEntryKeys(workExperiences);

    const listFor = (section) => (section === 'educations' ? educations : workExperiences);
    const setListFor = (section) => (section === 'educations' ? onEducationsChange : onWorkExperiencesChange);
    const addKeyFor = (section) => (section === 'educations' ? addEducationKey : addWorkExperienceKey);
    const removeKeyAtFor = (section) => (section === 'educations' ? removeEducationKeyAt : removeWorkExperienceKeyAt);

    const handleInputChange = (e, index, section) => {
        const updated = [...listFor(section)];
        if (updated[index]) {
            updated[index] = { ...updated[index], [e.target.name]: e.target.value };
            setListFor(section)(updated);
            onFieldChanged?.(section, index, e.target.name);
        }
    };

    const handleDateChange = (date, index, section, field) => {
        const updated = [...listFor(section)];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: date };
            setListFor(section)(updated);
            onFieldChanged?.(section, index, field);
        }
    };

    const handleAddSection = (section) => {
        const newEntry = section === 'educations' ? EMPTY_EDUCATION : EMPTY_WORK_EXPERIENCE;
        setListFor(section)([...listFor(section), { ...newEntry }]);
        addKeyFor(section)();
    };

    const handleRemoveSection = (index, section) => {
        const updated = [...listFor(section)];
        updated.splice(index, 1);
        setListFor(section)(updated);
        removeKeyAtFor(section)(index);
    };

    return (
        <>
            <Row className="mt-4">
                <Button onClick={() => handleAddSection('educations')} className="btn btn-primary btn-sm mr-2">{labels.addEducation}</Button>
            </Row>
            {educations.map((education, index) => (
                <div key={educationKeys[index]} className="mb-3">
                    <Row className="mt-4">
                        <Col md={6}>
                            <FormControl
                                placeholder={labels.institutionPlaceholder}
                                name="institution"
                                value={education.institution}
                                onChange={(e) => handleInputChange(e, index, 'educations')}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col md={6}>
                            <FormControl
                                placeholder={labels.titlePlaceholder}
                                name="title"
                                value={education.title}
                                onChange={(e) => handleInputChange(e, index, 'educations')}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col md={6}>
                            <DatePicker
                                selected={education.startDate}
                                onChange={(date) => handleDateChange(date, index, 'educations', 'startDate')}
                                dateFormat="yyyy-MM-dd"
                                placeholderText={labels.startDatePlaceholder}
                                className="form-control shadow-sm"
                            />
                        </Col>
                        <Col md={6}>
                            <DatePicker
                                selected={education.endDate}
                                onChange={(date) => handleDateChange(date, index, 'educations', 'endDate')}
                                dateFormat="yyyy-MM-dd"
                                placeholderText={labels.endDatePlaceholder}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'educations')} className="mt-2">
                        <Trash /> {labels.remove}
                    </Button>
                </div>
            ))}
            <Row className="mt-4">
                <Button onClick={() => handleAddSection('workExperiences')} className="btn btn-primary btn-sm mr-2">{labels.addWorkExperience}</Button>
            </Row>
            {workExperiences.map((experience, index) => (
                <div key={workExperienceKeys[index]} className="mb-3">
                    <Row className="mt-4">
                        <Col md={6}>
                            <FormControl
                                placeholder={labels.companyPlaceholder}
                                name="company"
                                value={experience.company}
                                onChange={(e) => handleInputChange(e, index, 'workExperiences')}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col md={6}>
                            <FormControl
                                placeholder={labels.positionPlaceholder}
                                name="position"
                                value={experience.position}
                                onChange={(e) => handleInputChange(e, index, 'workExperiences')}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col md={6}>
                            <DatePicker
                                selected={experience.startDate}
                                onChange={(date) => handleDateChange(date, index, 'workExperiences', 'startDate')}
                                dateFormat="yyyy-MM-dd"
                                placeholderText={labels.startDatePlaceholder}
                                className="form-control shadow-sm"
                            />
                        </Col>
                        <Col md={6}>
                            <DatePicker
                                selected={experience.endDate}
                                onChange={(date) => handleDateChange(date, index, 'workExperiences', 'endDate')}
                                dateFormat="yyyy-MM-dd"
                                placeholderText={labels.endDatePlaceholder}
                                className="form-control shadow-sm"
                            />
                        </Col>
                    </Row>
                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'workExperiences')} className="mt-2">
                        <Trash /> {labels.remove}
                    </Button>
                </div>
            ))}
        </>
    );
};

export default WorkHistoryFields;
