import React from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const LOCALE_OPTIONS = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
];

const LanguageSwitcher = () => {
    const { t, i18n } = useTranslation();

    return (
        // <fieldset>/<legend> en vez de role="group" + aria-label sobre un
        // <div> -- SonarCloud (accesibilidad) señala que un rol ARIA
        // "group" no llega igual de bien a todos los lectores de pantalla
        // como el elemento nativo pensado justo para esto. Los estilos en
        // línea deshacen la apariencia por defecto de <fieldset>/<legend>
        // (borde, relleno, tipografía de título) para que se vea igual que
        // antes.
        <fieldset
            className="d-flex align-items-center"
            style={{ border: 0, padding: 0, margin: 0 }}
        >
            <legend
                className="me-2 small text-muted mb-0"
                style={{ display: 'inline', width: 'auto', fontSize: 'inherit', border: 0, padding: 0, float: 'none' }}
            >
                {t('languageSwitcher.label')}
            </legend>
            {LOCALE_OPTIONS.map(({ code, label }) => (
                <Button
                    key={code}
                    type="button"
                    size="sm"
                    variant={i18n.resolvedLanguage === code ? 'primary' : 'outline-primary'}
                    className="me-1"
                    aria-pressed={i18n.resolvedLanguage === code}
                    lang={code}
                    onClick={() => i18n.changeLanguage(code)}
                >
                    {label}
                </Button>
            ))}
        </fieldset>
    );
};

export default LanguageSwitcher;
