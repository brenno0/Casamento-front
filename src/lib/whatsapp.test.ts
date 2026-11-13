import { linkConvite, montarTexto, telefoneInternacional, urlWhatsApp } from './whatsapp';

describe('whatsapp', () => {
  it('monta o texto trocando os marcadores e preserva os desconhecidos', () => {
    expect(
      montarTexto('Oi, {grupo}! {link} até {prazo}. {outro}', { grupo: 'Família', link: 'https://x/c/t', prazo: '2027-06-17' }),
    ).toBe('Oi, Família! https://x/c/t até 17/06/2027. {outro}');
  });

  it('prefixa 55 em telefones brasileiros sem código de país', () => {
    expect(telefoneInternacional('(11) 98888-7777')).toBe('5511988887777');
    expect(telefoneInternacional('1133334444')).toBe('551133334444');
    expect(telefoneInternacional('5511988887777')).toBe('5511988887777');
  });

  it('codifica o texto (acentos, &, quebras) e funciona sem telefone', () => {
    expect(urlWhatsApp('11988887777', 'Olá & até já\nbeijos')).toBe(
      'https://wa.me/5511988887777?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1%0Abeijos',
    );
    expect(urlWhatsApp(null, 'oi')).toBe('https://wa.me/?text=oi');
  });

  it('link do convite usa a origem', () => {
    expect(linkConvite('abc', 'https://casamento.com')).toBe('https://casamento.com/c/abc');
  });
});
