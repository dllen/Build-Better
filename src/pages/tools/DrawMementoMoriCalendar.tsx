import { useState, useCallback, useMemo } from "react";
import { CalendarDays, Download } from "lucide-react";

function getWeeksLived(birthDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

export default function DrawMementoMoriCalendar() {
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [lifeExpectancy, setLifeExpectancy] = useState(80);
  const [showCalendar, setShowCalendar] = useState(false);

  const birthDate = useMemo(() => new Date(birthYear, birthMonth - 1, birthDay), [birthYear, birthMonth, birthDay]);
  const totalWeeks = lifeExpectancy * 52;
  const weeksLived = getWeeksLived(birthDate);

  const handleDownload = useCallback(() => {
    // Generate a simple text representation
    const lines: string[] = [];
    for (let i = 0; i < totalWeeks; i++) {
      const row = Math.floor(i / 52);
      const col = i % 52;
      if (col === 0) lines.push(`Y${row + 1}: `);
      lines[lines.length - 1] += i < weeksLived ? "█" : "░";
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memento-mori-calendar.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [totalWeeks, weeksLived]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><CalendarDays className="h-5 w-5" /></div>
        <h1 className="text-2xl font-bold text-foreground">Memento Mori Calendar</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Visualize your life in weeks. Each box represents one week.</p>
      <div className="space-y-6 p-6 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Birth Year</label>
            <input type="number" min={1900} max={2100} value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
            <select value={birthMonth} onChange={(e) => setBirthMonth(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-muted">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("en", { month: "long" })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Day</label>
            <input type="number" min={1} max={31} value={birthDay}
              onChange={(e) => setBirthDay(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Life Expectancy (years): {lifeExpectancy}</label>
          <input type="range" min={50} max={120} value={lifeExpectancy}
            onChange={(e) => setLifeExpectancy(Number(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>50</span><span>120</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCalendar(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive transition-colors">
            <CalendarDays className="h-4 w-4" />Show Calendar
          </button>
          {showCalendar && (
            <button onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
              <Download className="h-4 w-4" />Download
            </button>
          )}
        </div>

        {showCalendar && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-destructive inline-block" />
                <span className="text-muted-foreground">Lived: {weeksLived.toLocaleString()} weeks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-border inline-block border border-border" />
                <span className="text-muted-foreground">Remaining: {(totalWeeks - weeksLived).toLocaleString()} weeks</span>
              </div>
              <span className="text-muted-foreground">({((weeksLived / totalWeeks) * 100).toFixed(1)}% lived)</span>
            </div>
            <div className="grid gap-0.5 p-3 rounded-lg bg-muted border border-border max-h-96 overflow-auto"
              style={{ gridTemplateColumns: `repeat(52, minmax(0, 1fr))` }}>
              {Array.from({ length: totalWeeks }, (_, i) => (
                <div key={i}
                  className={`aspect-square rounded-sm ${i < weeksLived ? "bg-destructive" : "bg-border"}`}
                  title={`Week ${i + 1}${i < weeksLived ? " (lived)" : " (ahead)"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center italic">
              “Remember that you will die.” Each row is one year of your life.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}