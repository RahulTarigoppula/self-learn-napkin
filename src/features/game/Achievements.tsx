import { useEffect, useState } from 'preact/hooks';
import { ACHIEVEMENTS, type GameInput, LEVELS, type Level, levelOf, XP, xpOf } from '../../engine/game/game';
import { Icon } from '../ui/Icon';
import { type GameRecord, gameInput, loadGame } from './store';

const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Level card plus the badge wall. Locked badges say exactly how to earn them. */
export default function Achievements() {
  const [state, setState] = useState<{ g: GameInput; rec: GameRecord; level: Level } | null>(null);

  useEffect(() => {
    const load = () =>
      void loadGame()
        .then(async (rec) => {
          const g = await gameInput(rec);
          setState({ g, rec, level: levelOf(xpOf(g)) });
        })
        .catch((e: unknown) => console.warn('achievements unavailable', e));
    load();
    document.addEventListener('napkin:game', load);
    document.addEventListener('napkin:stats', load);
    return () => {
      document.removeEventListener('napkin:game', load);
      document.removeEventListener('napkin:stats', load);
    };
  }, []);

  const level = state?.level ?? levelOf(0);
  const got = state?.rec.unlocked ?? {};
  const count = ACHIEVEMENTS.filter((a) => a.id in got).length;

  return (
    <section id="achievements" class="ach" aria-labelledby="ach-h">
      <div class="ach__level card">
        <div class="ach__badge" aria-hidden="true">
          <span class="mono">{level.level}</span>
        </div>
        <div class="ach__lvtext">
          <p class="eyebrow">Your level</p>
          <h2 id="ach-h">{level.name}</h2>
          <div
            class="ach__bar"
            role="progressbar"
            aria-label="Progress to the next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level.progress * 100)}
          >
            <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
          <p class="ach__xp mono">
            {level.xp} XP
            {level.next ? ` · ${level.next - level.xp} to ${LEVELS[level.level]?.name}` : ' · top level!'}
          </p>
        </div>
        <ul class="ach__earn">
          <li>
            Read a napkin <b class="mono">+{XP.read}</b>
          </li>
          <li>
            Ace a quiz <b class="mono">+{XP.quiz + XP.ace}</b>
          </li>
          <li>
            Daily challenge <b class="mono">+{XP.daily}</b>
          </li>
          <li>
            Try a playground <b class="mono">+{XP.played}</b>
          </li>
          <li>
            Review a card <b class="mono">+{XP.review}</b>
          </li>
        </ul>
      </div>

      <div class="ach__head">
        <h2>Achievements</h2>
        <span class="mono muted">
          {count} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <ul class="ach__grid">
        {ACHIEVEMENTS.map((a) => {
          const at = got[a.id];
          return (
            <li key={a.id} class="ach__item" data-on={at ? '' : undefined}>
              <span class="ach__icon" aria-hidden="true">
                <Icon name={at ? a.icon : 'lock'} size={22} />
              </span>
              <span class="ach__title">{a.title}</span>
              <span class="ach__how">{at ? `Earned ${fmt(at)}` : a.how}</span>
              <span class="sr-only">{at ? 'unlocked' : 'locked'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
