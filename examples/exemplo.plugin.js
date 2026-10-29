/**
 * @name Exemplo
 * @author janjahaters
 * @description Comandos /dado e /moeda no chat, responde "oi" e avisa quando alguém entra na call.
 * @version 1.0.0
 */

module.exports = class Exemplo {
  start() {
    this.offs = [
      janja.command('dado', 'rola um dado de 6 lados (ou /dado 20)', (arg) => {
        const lados = Math.max(2, Math.min(1000, parseInt(arg, 10) || 6));
        janja.send(`🎲 ${janja.me().name} rolou um d${lados}: **${1 + Math.floor(Math.random() * lados)}**`);
      }),
      janja.command('moeda', 'cara ou coroa', () => {
        janja.send(`🪙 ${Math.random() < 0.5 ? 'Cara' : 'Coroa'}!`);
      }),
      janja.onMessage((m) => {
        if (!m.mine && /^oi\b/i.test(m.text)) janja.toast(`${m.author} disse oi`);
      }),
      janja.on('join', (p) => janja.toast(`${p.name} entrou na call`)),
    ];
    // contagem de quantas vezes o plugin já foi ligado (guardada só neste PC)
    const vezes = janja.storage.get('vezes', 0) + 1;
    janja.storage.set('vezes', vezes);
    janja.addCSS('destaque', '.msg .text b { color: var(--accent-2); }');
  }

  stop() {
    // o app já desfaz comandos, eventos e CSS sozinho; isto é só para mostrar
    this.offs?.forEach((off) => off());
  }
};
