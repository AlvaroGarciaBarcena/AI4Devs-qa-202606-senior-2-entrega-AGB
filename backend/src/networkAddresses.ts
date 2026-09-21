import os from 'node:os';

// Antes, index.ts imprimía siempre "Server is running at
// http://localhost:PORT" a fuego, aunque el servidor escucha en TODAS las
// interfaces de red (app.listen sin host -- comportamiento por defecto de
// Node, confirmado con `ss -tlnp`: escucha en `*:3010`, no en
// `127.0.0.1:3010`). Ese mensaje engañoso costó una sesión entera de
// depuración real: sugería que solo era accesible desde la propia
// máquina, cuando sí respondía por la IP de la red local (confirmado
// también con curl). Ahora lista las direcciones reales, igual que hace
// Vite con sus líneas "Local"/"Network".
//
// `interfaces` se recibe por parámetro, en vez de llamar a
// os.networkInterfaces() aquí dentro, para poder testear con datos fijos
// sin depender de las interfaces de red reales de la máquina que corra
// los tests.
export const getListeningAddresses = (
    port: number,
    interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces(),
): string[] => {
    const lanAddresses = Object.values(interfaces)
        .flat()
        .filter((iface): iface is os.NetworkInterfaceInfo => !!iface && iface.family === 'IPv4' && !iface.internal)
        .map((iface) => `http://${iface.address}:${port}`);

    return [`http://localhost:${port}`, ...lanAddresses];
};
