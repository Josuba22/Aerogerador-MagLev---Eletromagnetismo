import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { calcularFisicaDinamicamente } from './physics.js';
import { RegressaoLinear } from './ai.js';

// Configuração Básica
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controlesCamera = new OrbitControls(camera, renderer.domElement);
controlesCamera.enableDamping = true;
controlesCamera.dampingFactor = 0.05;
controlesCamera.enablePan = true;
controlesCamera.screenSpacePanning = true;
controlesCamera.target.set(0, 3, 0);

const luz = new THREE.PointLight(0xffffff, 1.8, 100);
luz.position.set(10, 15, 10);
scene.add(luz);
scene.add(new THREE.AmbientLight(0x888888));

// Materiais Refinados
const matBase = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
const matCobre = new THREE.MeshStandardMaterial({ color: 0xffaa55, metalness: 0.7, roughness: 0.3 });
const matImaNeodimio = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.4, roughness: 0.3 });
const matPaSavonius = new THREE.MeshStandardMaterial({ color: 0x6699ff, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.2 });
const matBaseAzul = new THREE.MeshStandardMaterial({ color: 0x6699ff, metalness: 0.7, roughness: 0.2 });
const matAcrilico = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.1, transmission: 0.9, thickness: 0.5 });

// Elementos Estáticos
const hasteEstacionaria = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 32), matBase);
hasteEstacionaria.position.y = 3.5;
scene.add(hasteEstacionaria);

const baseInferior = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.2, 32), matBaseAzul);
scene.add(baseInferior);

const carcacaGerador = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.2, 32, 1, true), matAcrilico);
carcacaGerador.position.y = 0.7;
scene.add(carcacaGerador);

// Rotor Móvel
const rotor = new THREE.Group();
const eixoMovel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4.5, 16), matBase);
eixoMovel.position.y = 3.25;
rotor.add(eixoMovel);

const discoRotor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.2, 32), matBaseAzul);
discoRotor.position.y = 0.6;
rotor.add(discoRotor);

scene.add(rotor);

// Grupos Dinâmicos
const grupoImasRotor = new THREE.Group();
grupoImasRotor.position.y = 0.45;
rotor.add(grupoImasRotor);

const grupoLinhasCampo = new THREE.Group();
grupoLinhasCampo.position.y = 0.45;
rotor.add(grupoLinhasCampo);

const grupoImasBase = new THREE.Group();
scene.add(grupoImasBase);
const grupoEspirasBase = new THREE.Group();
scene.add(grupoEspirasBase);
const grupoSetasCorrente = new THREE.Group(); // NOVO: Grupo para as setas de corrente
scene.add(grupoSetasCorrente);
const grupoPas = new THREE.Group();
rotor.add(grupoPas);

function renderizarPas(raio) {
    grupoPas.children = [];

    const braco1 = new THREE.Mesh(new THREE.BoxGeometry(raio * 2, 0.1, 0.2), matBase);
    braco1.position.y = 3.5;
    const braco2 = new THREE.Mesh(new THREE.BoxGeometry(raio * 2, 0.1, 0.2), matBase);
    braco2.position.y = 4.5;
    grupoPas.add(braco1);
    grupoPas.add(braco2);

    const pa1 = new THREE.Mesh(new THREE.CylinderGeometry(raio / 2, raio / 2, 4, 32, 1, true, 0, Math.PI), matPaSavonius);
    pa1.position.set(-raio / 2, 4, 0);
    const pa2 = new THREE.Mesh(new THREE.CylinderGeometry(raio / 2, raio / 2, 4, 32, 1, true, Math.PI, Math.PI), matPaSavonius);
    pa2.position.set(raio / 2, 4, 0);
    grupoPas.add(pa1);
    grupoPas.add(pa2);
}

function criarCilindros(grupo, quantidade, raio, material, tamanhoRaio, alturaY) {
    grupo.children = [];
    for (let i = 0; i < quantidade; i++) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(tamanhoRaio, tamanhoRaio, 0.3, 16), material);
        const angulo = (i / quantidade) * Math.PI * 2;
        mesh.position.set(Math.cos(angulo) * raio, alturaY, Math.sin(angulo) * raio);
        grupo.add(mesh);
    }
}

function renderizarLinhasCampo(quantidade, raio, forcaIma, mostrar) {
    grupoLinhasCampo.children = [];
    if (!mostrar) return;

    const opacidadeMaterial = 0.3 * forcaIma;
    const matLinha = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: opacidadeMaterial });

    for (let i = 0; i < quantidade; i++) {
        const angulo = (i / quantidade) * Math.PI * 2;
        const x = Math.cos(angulo) * raio;
        const z = Math.sin(angulo) * raio;

        const curva = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, 0, z),
            new THREE.Vector3(x * 1.3, -0.5, z * 1.3),
            new THREE.Vector3(x, -0.9, z),
            new THREE.Vector3(x * 0.7, -0.5, z * 0.7),
            new THREE.Vector3(x, 0, z)
        ]);

        const geometria = new THREE.TubeGeometry(curva, 20, 0.05, 8, false);
        const linha = new THREE.Mesh(geometria, matLinha);

        grupoLinhasCampo.add(linha);
    }
}

// NOVO: Função para criar a base das setas de corrente nas bobinas
function criarSetasCorrente(quantidade, raio) {
    grupoSetasCorrente.children = [];
    for (let i = 0; i < quantidade; i++) {
        const angulo = (i / quantidade) * Math.PI * 2;
        // Direção tangencial para simular o fluxo nas espiras
        const dir = new THREE.Vector3(-Math.sin(angulo), 0, Math.cos(angulo)).normalize();
        const origem = new THREE.Vector3(Math.cos(angulo) * raio, 0.45, Math.sin(angulo) * raio);

        const seta = new THREE.ArrowHelper(dir, origem, 0.1, 0xffff00, 0.2, 0.1); // Amarelo
        seta.line.material.transparent = true;
        seta.cone.material.transparent = true;
        grupoSetasCorrente.add(seta);
    }
}

camera.position.set(0, 5, 12);
const ia = new RegressaoLinear();

const inputs = {
    vento: document.getElementById('vento'),
    raio: document.getElementById('raio-pas'),
    imas: document.getElementById('imas'),
    tipoIma: document.getElementById('tipo-ima'),
    espiras: document.getElementById('espiras'),
    carga: document.getElementById('carga'),
    mostrarLinhas: document.getElementById('mostrar-linhas')
};

const outputs = {
    vento: document.getElementById('val-vento'),
    raio: document.getElementById('val-raio'),
    imas: document.getElementById('val-imas'),
    espiras: document.getElementById('val-espiras'),
    carga: document.getElementById('val-carga'),
    rpm: document.getElementById('out-rpm'),
    tensao: document.getElementById('out-tensao'),
    altura: document.getElementById('out-altura'),
    previsao: document.getElementById('out-previsao')
};

let estadoAtual = { imas: 0, espiras: 0, raio: 0, forcaIma: 0, mostrarLinhas: true };

// Configuração Gráfico
const ctxGrafico = document.getElementById('graficoIA').getContext('2d');
const graficoIA = new Chart(ctxGrafico, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Dados', data: [], backgroundColor: 'rgba(255, 68, 68, 0.8)'
        }, {
            type: 'line', label: 'Tendência', data: [], borderColor: 'rgba(102, 153, 255, 1)', borderWidth: 2, fill: false, pointRadius: 0
        }]
    },
    options: { animation: false, responsive: true, scales: { x: { min: 0, max: 20 }, y: { min: 0 } } }
});

let contadorFrames = 0;

function animar() {
    requestAnimationFrame(animar);

    let vento = parseFloat(inputs.vento.value);
    let raio = parseFloat(inputs.raio.value);
    let numImas = parseInt(inputs.imas.value);
    let forcaIma = parseFloat(inputs.tipoIma.value);
    let numEspiras = parseInt(inputs.espiras.value);
    let carga = parseInt(inputs.carga.value);
    let mostrarLinhas = inputs.mostrarLinhas.checked;

    outputs.vento.innerText = vento;
    outputs.raio.innerText = raio.toFixed(1);
    outputs.imas.innerText = numImas;
    outputs.espiras.innerText = numEspiras;
    outputs.carga.innerText = carga;

    if (estadoAtual.imas !== numImas || estadoAtual.forcaIma !== forcaIma || estadoAtual.mostrarLinhas !== mostrarLinhas) {
        criarCilindros(grupoImasRotor, numImas, 1.8, matImaNeodimio, 0.3, 0);
        criarCilindros(grupoImasBase, numImas, 1.8, matImaNeodimio, 0.3, 0.25);
        renderizarLinhasCampo(numImas, 1.8, forcaIma, mostrarLinhas);

        estadoAtual.imas = numImas;
        estadoAtual.forcaIma = forcaIma;
        estadoAtual.mostrarLinhas = mostrarLinhas;
    }

    let numVisualEspiras = Math.floor(numEspiras / 50);
    if (estadoAtual.espiras !== numVisualEspiras) {
        criarCilindros(grupoEspirasBase, numVisualEspiras, 2.8, matCobre, 0.25, 0.25);
        criarSetasCorrente(numVisualEspiras, 2.8); // Recria as setas junto com as bobinas
        estadoAtual.espiras = numVisualEspiras;
    }

    if (estadoAtual.raio !== raio) {
        renderizarPas(raio);
        estadoAtual.raio = raio;
    }

    let sim = calcularFisicaDinamicamente(vento, numImas, numEspiras, raio, forcaIma, carga);
    let alturaLevitacao = sim.altura * 0.1;
    rotor.position.y = alturaLevitacao;
    outputs.altura.innerText = sim.altura.toFixed(2);

    if (sim.levitando) {
        rotor.rotation.y += (sim.rpm / 60) * 0.1;
    }

    outputs.rpm.innerText = sim.rpm.toFixed(0);
    outputs.tensao.innerText = sim.tensao.toFixed(2);

    // NOVO: Anima as setas de corrente baseadas no RPM
    grupoSetasCorrente.visible = mostrarLinhas;
    if (mostrarLinhas) {
        const intensidadeCorrente = sim.rpm / 30; // Escala baseada na rotação
        grupoSetasCorrente.children.forEach(seta => {
            if (sim.rpm > 0) {
                seta.visible = true;
                // Aumenta o tamanho da seta
                seta.setLength(0.4 + intensidadeCorrente, 0.2 + intensidadeCorrente * 0.2, 0.1 + intensidadeCorrente * 0.1);
                // Aumenta o brilho (opacidade)
                const opacidade = Math.min(0.2 + intensidadeCorrente, 1);
                seta.line.material.opacity = opacidade;
                seta.cone.material.opacity = opacidade;
            } else {
                seta.visible = false;
            }
        });
    }

    ia.adicionarDado(vento, sim.tensao);
    outputs.previsao.innerText = ia.preverEnergia(vento).toFixed(2);

    contadorFrames++;
    if (contadorFrames % 15 === 0) {
        graficoIA.data.datasets.data = ia.dadosVento.map((v, i) => ({ x: v, y: ia.dadosTensao[i] }));

        let yZero = ia.preverEnergia(0) / 1.5;
        let yVinte = ia.preverEnergia(20) / 1.5;
        graficoIA.data.datasets[1].data = [{ x: 0, y: yZero }, { x: 20, y: yVinte }];

        graficoIA.update();
    }

    controlesCamera.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animar();