// Simplificação da Lei de Faraday-Lenz e da Levitação Magnética
export function calcularFisicaDinamicamente(vento, numImas, numEspiras, raioPas, forcaIma, carga) {
    // 1. Levitação Magnética: A força depende da quantidade e do tipo (força) do ímã
    const FORCA_BASE = 2.5 * forcaIma;
    const FORCA_GRAVIDADE = 5.0 + (raioPas * 0.5); // Pás maiores deixam o rotor mais pesado

    // A repulsão aumenta exponencialmente com os ímãs
    let forcaRepulsao = Math.pow(numImas * FORCA_BASE, 1.2);
    let altura = forcaRepulsao - FORCA_GRAVIDADE;
    let levitando = altura > 0;
    altura = levitando ? altura : 0;

    // 2. Rotação (RPM): Só ocorre se o eixo estiver levitando (sem atrito)
    let rpm = 0;
    if (levitando) {
        // Pás maiores captam mais vento, aumentando a rotação base
        let rpmBase = vento * 15 * (raioPas / 2.5);

        // A carga elétrica conectada atua como um freio eletromagnético no eixo
        let freioEletromagnetico = 1 - (carga / 200);
        rpm = rpmBase * freioEletromagnetico;
    }

    // 3. Tensão Gerada: V = N * B * w (simplificado)
    const COEFICIENTE_FARADAY = 0.05;
    let intensidadeCampoB = numImas * forcaIma;
    let tensao = (rpm * intensidadeCampoB * numEspiras * COEFICIENTE_FARADAY) / 60;

    return { levitando, altura, rpm, tensao };
}