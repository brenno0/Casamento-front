import { animate, stagger, type JSAnimation } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, type RefObject } from 'react';
import { prefereMenosMovimento } from '../../lib/motion';

/**
 * Coreografia do site (GSAP + AnimeJS). O HTML e o CSS já descrevem o estado final;
 * aqui só se anima a partir dele, então sem JS ou com menos movimento tudo aparece no lugar.
 *
 * Marcadores lidos dentro de `ref`:
 * - `[data-hero-linha]`, `[data-hero-regua]`, `[data-hero-info]`, `[data-hero-saudacao]`: abertura.
 * - `.envelope`, `.envelope-aba`, `.envelope-foto`: a foto saindo do envelope.
 * - `[data-titulo] [data-palavra]`: títulos de seção, palavra por palavra.
 * - `[data-reveal]`: sobe e aparece ao rolar. `[data-parallax]`: desliza com a rolagem.
 * - `[data-pintar]`: a aquarela se pinta de baixo para cima com a rolagem.
 * - `[data-contar]`: horário que conta até o valor (`data-contar="16"`).
 * - `[data-varal]`: polaroides caem no varal. `[data-paleta]`: amostras de cor saltam.
 * - `[data-alfinete]`: alfinete do mapa cai e quica. `[data-cascata]`: filhos entram em cascata.
 * - `[data-rodape]`: nomes do rodapé.
 */
export function useAnimacoesSite(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || prefereMenosMovimento()) return;
    // Registrado aqui, não no import: ScrollTrigger exige matchMedia (ausente nos testes).
    gsap.registerPlugin(ScrollTrigger);
    const animes: JSAnimation[] = [];
    const restaurar: (() => void)[] = [];
    const todos = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, raiz);
    const um = (sel: string) => raiz.querySelector<HTMLElement>(sel);
    const aoEntrar = (trigger: Element, onEnter: () => void, start = 'top 82%') => ScrollTrigger.create({ trigger, start, once: true, onEnter });

    const ctx = gsap.context(() => {
      const nav = um('nav');
      if (nav) gsap.from(nav, { yPercent: -100, duration: 0.9, ease: 'expo.out', delay: 0.1 });

      // Abertura: nomes sobem da dobra, a régua se desenha, o resto aparece.
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
        .from(todos('[data-hero-linha]'), { yPercent: 110, duration: 1.2, stagger: 0.14 })
        .from(todos('[data-hero-regua]'), { scaleX: 0, transformOrigin: '0 50%', duration: 1.1 }, '-=0.8')
        .from(todos('[data-hero-info] > *'), { y: 18, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.8')
        .from(todos('[data-hero-saudacao]'), { y: 28, opacity: 0, duration: 1 }, '-=0.5');

      // Envelope: entra, a aba abre, a foto sobe por trás do bolso e pousa por cima.
      const envelope = um('.envelope');
      const aba = um('.envelope-aba');
      const foto = um('.envelope-foto');
      if (envelope && aba && foto) {
        gsap
          .timeline({ delay: 0.4 })
          .from(envelope, { y: 48, opacity: 0, duration: 0.9, ease: 'expo.out' })
          .fromTo(aba, { rotateX: 0, zIndex: 30 }, { rotateX: 180, duration: 0.75, ease: 'power2.inOut' }, '-=0.2')
          .set(aba, { zIndex: 5 })
          .fromTo(foto, { yPercent: 68, rotate: 0, zIndex: 10 }, { yPercent: -12, rotate: -3.5, duration: 1.15, ease: 'power2.inOut' }, '-=0.15')
          .set(foto, { zIndex: 40 })
          .to(foto, { yPercent: 0, rotate: -2, duration: 1, ease: 'expo.out' });
      }

      todos('[data-titulo]').forEach((h) => {
        gsap.from(h.querySelectorAll('[data-palavra]'), {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: h, start: 'top 88%', once: true },
        });
      });

      todos('[data-reveal]').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 36, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });

      todos('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      todos('[data-pintar]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'center 50%', scrub: 0.8 } },
        );
      });

      // Horários contam de 0 até a hora (AnimeJS).
      todos('[data-contar]').forEach((el) => {
        const alvo = Number(el.dataset.contar);
        const final = el.textContent ?? '';
        const resto = final.replace(/^\d+/, '');
        const valor = { n: 0 };
        el.textContent = `0${resto}`;
        aoEntrar(el, () => {
          animes.push(
            animate(valor, {
              n: alvo,
              duration: 1800,
              ease: 'outExpo',
              onUpdate: () => {
                el.textContent = `${Math.round(valor.n)}${resto}`;
              },
              onComplete: () => {
                el.textContent = final;
              },
            }),
          );
        });
        restaurar.push(() => {
          el.textContent = final;
        });
      });

      // Polaroides: os prendedores aparecem no fio e as fotos caem balançando (AnimeJS).
      todos('[data-varal]').forEach((lista) => {
        const prendedores = lista.querySelectorAll<HTMLElement>('.prendedor');
        const fotos = lista.querySelectorAll<HTMLElement>('[data-polaroide]');
        gsap.set(prendedores, { opacity: 0 });
        gsap.set(fotos, { opacity: 0 });
        aoEntrar(lista, () => {
          animes.push(animate(prendedores, { opacity: [0, 1], translateY: [-12, 0], delay: stagger(70), duration: 500, ease: 'outQuad' }));
          fotos.forEach((foto, n) => {
            animes.push(
              animate(foto, {
                opacity: [0, 1],
                translateY: [-90, 0],
                rotate: [n % 2 ? 14 : -14, 0],
                delay: 250 + n * 110,
                duration: 1600,
                ease: 'outElastic(1, .5)',
              }),
            );
          });
        });
      });

      // Paleta do dress code salta, uma cor por vez (AnimeJS).
      todos('[data-paleta]').forEach((lista) => {
        const cores = lista.querySelectorAll<HTMLElement>('li > span');
        gsap.set(cores, { opacity: 0 });
        aoEntrar(lista, () => {
          animes.push(animate(cores, { opacity: [0, 1], scale: [0.3, 1], translateY: [24, 0], delay: stagger(90), duration: 1200, ease: 'outElastic(1, .6)' }));
        });
      });

      // Alfinete do mapa cai e quica (AnimeJS).
      todos('[data-alfinete]').forEach((pino) => {
        gsap.set(pino, { opacity: 0 });
        aoEntrar(pino, () => {
          animes.push(animate(pino, { opacity: [0, 1], translateY: [-80, 0], duration: 1400, ease: 'outBounce' }));
        });
      });

      todos('[data-cascata]').forEach((lista) => {
        gsap.from(lista.children, {
          opacity: 0,
          x: -24,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
        });
      });

      const rodape = um('[data-rodape]');
      if (rodape) {
        gsap.from(rodape.children, {
          opacity: 0,
          y: 40,
          scale: 0.96,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.15,
          scrollTrigger: { trigger: rodape, start: 'top 95%', once: true },
        });
      }
    }, raiz);

    // Fotos carregando mudam alturas; recalcula os gatilhos.
    const recalcular = () => ScrollTrigger.refresh();
    window.addEventListener('load', recalcular);

    return () => {
      window.removeEventListener('load', recalcular);
      animes.forEach((a) => a.revert());
      ctx.revert();
      restaurar.forEach((r) => r());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
