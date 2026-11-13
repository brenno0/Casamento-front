import { animate, stagger, type JSAnimation } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useLayoutEffect, type RefObject } from 'react';
import { prefereMenosMovimento } from '../../lib/motion';

/**
 * Coreografia do site (Lenis + GSAP + AnimeJS). O HTML e o CSS já descrevem o estado final;
 * aqui só se anima a partir dele, então sem JS ou com menos movimento tudo aparece no lugar.
 *
 * Marcadores lidos dentro de `ref`:
 * - `[data-hero]`, `[data-hero-nomes]`, `[data-hero-linha]`, `[data-hero-regua]`, `[data-hero-info]`,
 *   `[data-hero-saudacao]`: abertura e a saída dela ao rolar.
 * - `.envelope`, `.envelope-aba`, `.envelope-foto`: a foto saindo do envelope (e inclinando com o mouse).
 * - `[data-titulo] [data-palavra]`: títulos de seção, letra por letra.
 * - `[data-linhas]`: parágrafos que sobem linha por linha.
 * - `[data-reveal]`: sobe e aparece ao rolar. `[data-parallax]`: desliza com a rolagem.
 * - `[data-foto-historia]`: foto que se endireita e cresce com a rolagem.
 * - `[data-linha-do-tempo]` com `[data-linha]` e `[data-ponto]`: fio da história.
 * - `[data-pintar]`: a aquarela se pinta de baixo para cima com a rolagem.
 * - `[data-cardapio]`: o cartão é pousado sobre a mesa. `[data-filete]`: filetes que se desenham.
 * - `[data-contar]`: horário que conta até o valor (`data-contar="16"`).
 * - `[data-varal]`: varal que anda de lado com a rolagem (desktop) e balança com a velocidade.
 * - `[data-paleta]`: amostras de cor saltam.
 * - `[data-alfinete]`: alfinete do mapa cai e quica. `[data-cascata]`: filhos entram em cascata.
 * - `[data-rodape]`: nomes do rodapé, letra por letra. `[data-progresso]`: barra de leitura.
 */
export function useAnimacoesSite(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || prefereMenosMovimento()) return;
    // Registrado aqui, não no import: ScrollTrigger exige matchMedia (ausente nos testes).
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const animes: JSAnimation[] = [];
    const restaurar: (() => void)[] = [];
    const todos = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, raiz);
    const um = (sel: string) => raiz.querySelector<HTMLElement>(sel);
    const aoEntrar = (trigger: Element, onEnter: () => void, start = 'top 82%') => ScrollTrigger.create({ trigger, start, once: true, onEnter });
    const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Rolagem macia (roda do mouse e trackpad; toque continua nativo), no mesmo relógio do GSAP.
    const lenis = new Lenis({ lerp: 0.085, anchors: { offset: -64 } });
    lenis.on('scroll', ScrollTrigger.update);
    const passo = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(passo);
    gsap.ticker.lagSmoothing(0);
    restaurar.push(() => {
      gsap.ticker.remove(passo);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    });

    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      const nav = um('nav');
      if (nav) gsap.from(nav, { yPercent: -100, duration: 1, ease: 'expo.out', delay: 0.2 });

      const progresso = um('[data-progresso]');
      if (progresso) {
        gsap.fromTo(progresso, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
      }

      // ── Abertura ─────────────────────────────────────────────────────────────
      const linhasHero = todos('[data-hero-linha]');
      const letrasHero = linhasHero.length ? SplitText.create(linhasHero, { type: 'chars' }).chars : [];
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, delay: 0.25 })
        .from(letrasHero, { yPercent: 120, rotateX: -90, rotate: 6, transformOrigin: '50% 100%', duration: 1.4, stagger: 0.035 })
        .from(todos('[data-hero-regua]'), { scaleX: 0, transformOrigin: '0 50%', duration: 1.4 }, '-=1')
        .from(todos('[data-hero-info] > *'), { y: 28, opacity: 0, duration: 1, stagger: 0.09 }, '-=1.1')
        .from(todos('[data-hero-saudacao]'), { y: 40, opacity: 0, rotate: -2, duration: 1.2 }, '-=0.7');

      const envelope = um('.envelope');
      const aba = um('.envelope-aba');
      const foto = um('.envelope-foto');
      if (envelope && aba && foto) {
        gsap
          .timeline({ delay: 0.45 })
          .from(envelope, { y: 120, rotate: 6, opacity: 0, duration: 1.2, ease: 'expo.out' })
          .fromTo(aba, { rotateX: 0, zIndex: 30 }, { rotateX: 180, duration: 0.8, ease: 'power3.inOut' }, '-=0.3')
          .set(aba, { zIndex: 5 })
          .fromTo(foto, { yPercent: 68, rotate: 0, zIndex: 10 }, { yPercent: -16, rotate: -5, duration: 1.2, ease: 'power3.inOut' }, '-=0.15')
          .set(foto, { zIndex: 40 })
          .to(foto, { yPercent: 0, rotate: -2, duration: 1.4, ease: 'elastic.out(1, 0.55)' });

        // Inclina com o mouse, como um cartão na mão.
        if (temMouse) {
          gsap.set(envelope, { transformPerspective: 900 });
          const rx = gsap.quickTo(envelope, 'rotateX', { duration: 0.8, ease: 'power3.out' });
          const ry = gsap.quickTo(envelope, 'rotateY', { duration: 0.8, ease: 'power3.out' });
          const mover = (e: PointerEvent) => {
            const r = envelope.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 14);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const sair = () => {
            rx(0);
            ry(0);
          };
          envelope.addEventListener('pointermove', mover);
          envelope.addEventListener('pointerleave', sair);
          restaurar.push(() => {
            envelope.removeEventListener('pointermove', mover);
            envelope.removeEventListener('pointerleave', sair);
          });
        }
      }

      // A abertura sai de cena ao rolar: nomes sobem e esmaecem, envelope desce e gira.
      const hero = um('[data-hero]');
      if (hero) {
        const saida = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
        const nomes = um('[data-hero-nomes]');
        if (nomes) gsap.to(nomes, { yPercent: -35, opacity: 0.15, ease: 'none', scrollTrigger: saida });
        const envolto = um('[data-hero-envelope]');
        if (envolto) gsap.to(envolto, { y: 160, rotate: 5, scale: 0.92, ease: 'none', scrollTrigger: saida });
      }

      // ── Textos ───────────────────────────────────────────────────────────────
      todos('[data-titulo]').forEach((h) => {
        const letras = SplitText.create(h.querySelectorAll('[data-palavra]'), { type: 'chars' }).chars;
        gsap.from(letras, {
          yPercent: 120,
          rotate: 12,
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.028,
          scrollTrigger: { trigger: h, start: 'top 90%', once: true },
        });
      });

      todos('[data-linhas]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      todos('[data-reveal]').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 60, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });

      // ── História ─────────────────────────────────────────────────────────────
      todos('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: 18 }, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      todos('[data-foto-historia]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { rotate: i % 2 ? 12 : -12, scale: 0.78, clipPath: 'inset(12% 12% 12% 12%)' },
          {
            rotate: i % 2 ? 1.5 : -1.5,
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
          },
        );
      });
      todos('[data-linha-do-tempo]').forEach((lista) => {
        const linha = lista.querySelector('[data-linha]');
        if (linha) {
          gsap.fromTo(linha, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: lista, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } });
        }
        lista.querySelectorAll<HTMLElement>('[data-ponto]').forEach((ponto) => {
          gsap.set(ponto, { opacity: 0 });
          aoEntrar(
            ponto,
            () => {
              animes.push(animate(ponto, { opacity: [0, 1], scale: [0, 1.6, 1], duration: 1100, ease: 'outElastic(1, .45)' }));
            },
            'top 65%',
          );
        });
      });

      // ── Igreja e cerimônia ───────────────────────────────────────────────────
      todos('[data-pintar]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18, yPercent: 8 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 45%', scrub: 0.8 },
          },
        );
      });

      todos('[data-cardapio]').forEach((card) => {
        gsap.fromTo(
          card,
          { rotateX: 55, y: 160, scale: 0.85, opacity: 0, transformPerspective: 1200, transformOrigin: '50% 100%' },
          { rotateX: 0, y: 0, scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 105%', end: 'top 45%', scrub: 0.8 } },
        );
        gsap.from(card.querySelectorAll('[data-filete]'), {
          scaleX: 0,
          duration: 1.2,
          ease: 'expo.inOut',
          stagger: 0.1,
          scrollTrigger: { trigger: card, start: 'top 55%', once: true },
        });
      });

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
              duration: 2200,
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

      // ── Dress code ───────────────────────────────────────────────────────────
      todos('[data-paleta]').forEach((lista) => {
        const cores = lista.querySelectorAll<HTMLElement>('li > span');
        gsap.set(cores, { opacity: 0 });
        aoEntrar(lista, () => {
          cores.forEach((cor, n) => {
            animes.push(
              animate(cor, {
                opacity: [0, 1],
                translateY: [140, 0],
                rotate: [n % 2 ? 25 : -25, 0],
                scale: [0.4, 1],
                delay: n * 110,
                duration: 1500,
                ease: 'outElastic(1, .55)',
              }),
            );
          });
        });
      });

      // ── Galeria: o varal anda de lado com a rolagem e balança com a velocidade ──
      todos('[data-varal]').forEach((lista) => {
        const secao = lista.closest('section');
        if (!secao) return;
        const prendedores = lista.querySelectorAll<HTMLElement>('.prendedor');
        const fotos = lista.querySelectorAll<HTMLElement>('[data-polaroide]');
        gsap.set([...prendedores, ...fotos], { opacity: 0 });
        aoEntrar(lista, () => {
          animes.push(animate(prendedores, { opacity: [0, 1], translateY: [-20, 0], delay: stagger(70), duration: 600, ease: 'outQuad' }));
          fotos.forEach((f, n) => {
            animes.push(
              animate(f, {
                opacity: [0, 1],
                translateY: [-160, 0],
                rotate: [n % 2 ? 24 : -24, 0],
                delay: 250 + n * 120,
                duration: 1800,
                ease: 'outElastic(1, .4)',
              }),
            );
          });
        });

        gsap.set(lista, { '--balanco': '0deg' });
        const balanco = gsap.quickTo(lista, '--balanco', { duration: 0.9, ease: 'power3.out', unit: 'deg' } as Parameters<typeof gsap.quickTo>[2]);
        const vento = (v: number) => balanco(gsap.utils.clamp(-10, 10, v / -180));

        mm.add('(min-width: 768px)', () => {
          // O varal deixa de rolar sozinho: a rolagem da página é que o move.
          secao.dataset.varalAnimado = '';
          lista.scrollLeft = 0;
          // Até a última polaroide encostar na margem direita, sem sobra.
          const distancia = () => {
            const ultima = lista.lastElementChild as HTMLElement | null;
            const janela = lista.parentElement?.clientWidth ?? lista.clientWidth;
            if (!ultima) return 0;
            const margem = parseFloat(getComputedStyle(lista).paddingRight) || 0;
            return Math.max(0, ultima.offsetLeft + ultima.offsetWidth + margem - janela);
          };
          gsap.to(lista, {
            x: () => -distancia(),
            ease: 'none',
            scrollTrigger: {
              trigger: secao,
              start: 'top top',
              end: () => `+=${distancia()}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) => vento(self.getVelocity()),
            },
          });
          return () => {
            delete secao.dataset.varalAnimado;
          };
        });
        mm.add('(max-width: 767px)', () => {
          ScrollTrigger.create({ trigger: secao, start: 'top bottom', end: 'bottom top', onUpdate: (self) => vento(self.getVelocity()) });
        });
      });

      // ── Fim da página ────────────────────────────────────────────────────────
      todos('[data-alfinete]').forEach((pino) => {
        gsap.set(pino, { opacity: 0 });
        aoEntrar(pino, () => {
          animes.push(animate(pino, { opacity: [0, 1], translateY: [-160, 0], duration: 1600, ease: 'outBounce' }));
        });
      });

      todos('[data-cascata]').forEach((lista) => {
        gsap.from(lista.children, {
          opacity: 0,
          x: -60,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
        });
      });

      // Resposta da dúvida desliza ao abrir.
      gsap.utils.toArray<HTMLDetailsElement>('[data-cascata] details', raiz).forEach((d) => {
        const resposta = d.querySelector('p');
        const aoAbrir = () => {
          if (d.open && resposta) gsap.from(resposta, { height: 0, opacity: 0, y: -10, duration: 0.6, ease: 'expo.out', clearProps: 'height' });
        };
        d.addEventListener('toggle', aoAbrir);
        restaurar.push(() => d.removeEventListener('toggle', aoAbrir));
      });

      const rodape = um('[data-rodape]');
      if (rodape) {
        const nomes = rodape.querySelector('[data-rodape-nomes]');
        const letras = nomes ? SplitText.create(nomes, { type: 'chars' }).chars : [];
        gsap.from(letras, {
          yPercent: 130,
          opacity: 0,
          rotate: 10,
          duration: 1.4,
          ease: 'expo.out',
          stagger: 0.04,
          scrollTrigger: { trigger: rodape, start: 'top 90%', once: true },
        });
        gsap.from(rodape.querySelectorAll('[data-rodape-e]'), {
          rotate: -360,
          scale: 0,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: rodape, start: 'top 85%', once: true },
        });
      }

      // ── Botões magnéticos (só com mouse) ─────────────────────────────────────
      if (temMouse) {
        todos('.botao, .botao-contorno').forEach((b) => {
          const x = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3.out' });
          const y = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3.out' });
          const mover = (e: PointerEvent) => {
            const r = b.getBoundingClientRect();
            x((e.clientX - r.left - r.width / 2) * 0.3);
            y((e.clientY - r.top - r.height / 2) * 0.4);
          };
          const sair = () => {
            gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
          };
          b.addEventListener('pointermove', mover);
          b.addEventListener('pointerleave', sair);
          restaurar.push(() => {
            b.removeEventListener('pointermove', mover);
            b.removeEventListener('pointerleave', sair);
          });
        });
      }
    }, raiz);

    // Fotos e fontes carregando mudam alturas; recalcula os gatilhos.
    const recalcular = () => ScrollTrigger.refresh();
    window.addEventListener('load', recalcular);
    void document.fonts?.ready.then(recalcular);

    return () => {
      window.removeEventListener('load', recalcular);
      animes.forEach((a) => a.revert());
      mm.revert();
      ctx.revert();
      restaurar.forEach((r) => r());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
