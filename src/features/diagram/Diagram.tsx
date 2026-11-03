import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { speeds, useRailway } from "../../app/store";
import { describeNode } from "../../engine/explain";
import { STATION_HEIGHT, type Diagram as DiagramData } from "../../engine/layout";
import { trainAt } from "../debugger/train";
import { Burst } from "./Burst";
import { Train } from "./Train";
import { useT } from "../../i18n";
import styles from "./Diagram.module.css";

const LANES = 7;

const laneColor = (lane: number) => ({ "--lane": `var(--lane-${lane % LANES})` }) as CSSProperties;

const MAX_SCALE = 1.7;
const BUBBLE_SPACE = 84;
const BUBBLE_HALF_WIDTH = 130;

type Anchor = { x: number; top: number; bottom: number };

const anchorOf = (diagram: DiagramData, id: number): Anchor | null => {
  const station = diagram.stations.find((item) => item.id === id);
  if (station)
    return { x: station.x + station.width / 2, top: station.y, bottom: station.y + station.height };
  const frame = diagram.frames.find((item) => item.id === id);
  if (frame)
    return { x: frame.x + Math.min(frame.width / 2, 60), top: frame.y, bottom: frame.y + 24 };
  const point = diagram.points.get(id);
  return point
    ? { x: point.x, top: point.y - STATION_HEIGHT / 2, bottom: point.y + STATION_HEIGHT / 2 }
    : null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function Diagram() {
  const scroller = useRef<HTMLDivElement>(null);
  const { analysis, flags, phrases } = useAnalysisValue();
  const t = useT();
  const step = useRailway((state) => state.step);
  const speed = useRailway((state) => state.speed);
  const focus = useRailway((state) => state.focus);
  const setFocus = useRailway((state) => state.setFocus);

  const [available, setAvailable] = useState(0);
  const train = analysis.ok ? trainAt(analysis, step) : null;
  const point = train?.point;
  const width = analysis.ok ? analysis.diagram.width : 1;
  const scale = available > 0 ? clamp(available / width, 1, MAX_SCALE) : 1;

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element || !point) return;
    const x = point.x * scale;
    const left = element.scrollLeft;
    const visible = x > left + 80 && x < left + element.clientWidth - 80;
    if (!visible) element.scrollTo({ left: x - element.clientWidth / 2, behavior: "smooth" });
  }, [point, scale]);

  if (!analysis.ok) {
    return (
      <div className={styles.broken}>
        <p>{t.map.broken}</p>
      </div>
    );
  }

  const { diagram, parsed } = analysis;
  const focused = focus === null ? null : parsed.nodes.get(focus);
  const anchor = focus === null ? null : anchorOf(diagram, focus);
  const canvasWidth = diagram.width * scale;
  const below = anchor !== null && anchor.top * scale < BUBBLE_SPACE;
  const bubble = anchor && {
    left: clamp(anchor.x * scale, BUBBLE_HALF_WIDTH, canvasWidth - BUBBLE_HALF_WIDTH),
    top: (below ? anchor.bottom : anchor.top) * scale,
    tail:
      anchor.x * scale -
      clamp(anchor.x * scale, BUBBLE_HALF_WIDTH, canvasWidth - BUBBLE_HALF_WIDTH),
  };

  const hover = (id: number) => ({
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setFocus(id);
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setFocus(null);
    },
    onPointerUp: (event: PointerEvent) => {
      if (event.pointerType !== "mouse") setFocus(useRailway.getState().focus === id ? null : id);
    },
  });

  return (
    <div
      ref={scroller}
      className={styles.scroller}
      role="region"
      aria-label={t.map.region}
      tabIndex={0}
      style={{ "--train-speed": `${speeds[speed].interval}ms` } as CSSProperties}
    >
      <div className={styles.canvas} style={{ width: canvasWidth, height: diagram.height * scale }}>
        <svg
          className={styles.svg}
          width={canvasWidth}
          height={diagram.height * scale}
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          role="img"
          aria-label={t.map.image}
        >
          {diagram.frames.map((frame) => (
            <g
              key={frame.id}
              className={styles.frame}
              data-kind={frame.kind}
              data-focus={focus === frame.id ? true : undefined}
              style={laneColor(frame.lane)}
              {...hover(frame.id)}
            >
              <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={14} />
              <text x={frame.x + 12} y={frame.y + 15}>
                {frame.label}
              </text>
            </g>
          ))}

          {diagram.tracks.map((track, index) => (
            <path
              key={`${track.owner}-${index}`}
              d={track.d}
              className={styles.track}
              data-kind={track.kind}
              data-active={train?.node === track.owner && train.tone === "back" ? true : undefined}
              style={laneColor(track.lane)}
            />
          ))}

          {diagram.notes.map((note) => (
            <text
              key={note.owner}
              x={note.x}
              y={note.y}
              className={styles.note}
              style={laneColor(note.lane)}
            >
              {note.text}
            </text>
          ))}

          <circle cx={diagram.start.x} cy={diagram.start.y} r={7} className={styles.terminal} />
          <g
            className={styles.terminalEnd}
            data-reached={train?.tone === "match" ? true : undefined}
          >
            <circle cx={diagram.end.x} cy={diagram.end.y} r={9} />
            <circle cx={diagram.end.x} cy={diagram.end.y} r={4} />
          </g>

          {diagram.stations.map((station) => {
            const current = train?.node === station.id;
            return (
              <g
                key={station.id}
                className={styles.station}
                data-kind={station.kind}
                data-state={
                  current ? train.tone : train?.visited.has(station.id) ? "visited" : undefined
                }
                data-focus={focus === station.id ? true : undefined}
                style={laneColor(station.lane)}
                {...hover(station.id)}
              >
                {current && (
                  <rect
                    key={`ripple-${step}`}
                    className={styles.ripple}
                    data-tone={train.tone}
                    x={station.x}
                    y={station.y}
                    width={station.width}
                    height={station.height}
                    rx={station.kind === "anchor" ? STATION_HEIGHT / 2 : 9}
                  />
                )}
                <rect
                  x={station.x}
                  y={station.y}
                  width={station.width}
                  height={station.height}
                  rx={station.kind === "anchor" ? STATION_HEIGHT / 2 : 9}
                />
                <text x={station.x + station.width / 2} y={station.y + station.height / 2}>
                  {station.label}
                </text>
              </g>
            );
          })}

          {train?.tone === "match" && <Burst key={`burst-${step}`} at={diagram.end} />}
          {train && <Train point={train.point} tone={train.tone} step={step} />}
        </svg>

        {focused && bubble && (
          <p
            className={styles.bubble}
            data-place={below ? "below" : "above"}
            style={
              { left: bubble.left, top: bubble.top, "--tail": `${bubble.tail}px` } as CSSProperties
            }
            role="status"
          >
            {describeNode(focused, flags, phrases)}
          </p>
        )}
      </div>
    </div>
  );
}
