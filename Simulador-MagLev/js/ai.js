export class RegressaoLinear {
    constructor() {
        this.dadosVento = [];
        this.dadosTensao = [];
    }

    adicionarDado(vento, tensao) {
        // Filtro: Só adiciona novos dados se os valores sofrerem alguma alteração
        let ultimoIndice = this.dadosVento.length - 1;
        if (ultimoIndice >= 0 && this.dadosVento[ultimoIndice] === vento && this.dadosTensao[ultimoIndice] === tensao) {
            return;
        }

        this.dadosVento.push(vento);
        this.dadosTensao.push(tensao);
        if (this.dadosVento.length > 50) {
            this.dadosVento.shift();
            this.dadosTensao.shift();
        }
    }

    preverEnergia(ventoAtual) {
        if (this.dadosVento.length < 2) return 0;

        let n = this.dadosVento.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += this.dadosVento[i];
            sumY += this.dadosTensao[i];
            sumXY += this.dadosVento[i] * this.dadosTensao[i];
            sumXX += this.dadosVento[i] * this.dadosVento[i];
        }

        let denominador = (n * sumXX - sumX * sumX);

        // Trava matemática contra divisão por zero
        if (denominador === 0) {
            return (sumY / n) * 1.5;
        }

        let inclinacao = (n * sumXY - sumX * sumY) / denominador;
        let intercepto = (sumY - inclinacao * sumX) / n;

        let tensaoPrevista = (inclinacao * ventoAtual) + intercepto;
        return tensaoPrevista > 0 ? tensaoPrevista * 1.5 : 0;
    }
}