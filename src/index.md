---
toc: false
---

<!-- Import modules -->
```js
import {Trend} from "./components/trend.js";
```

<!-- Import data and explicitly parse dates-->
```js
const incidents = FileAttachment("data/stlmpd_nibrs_with_avg.csv").csv({
  typed: true,
  parse: {
      YearMonth: d3.utcParse("%Y-%m-%d"),
      Year: d => +d,
      Month: d => +d,
      MonthName: d => d,
      IncidentCount: d => +d,
      IncidentMonthlyAvg: d => +d,
      IncidentYoYPctChg: d => +d,
      IncidentYoYChg: d => d,
      Neighborhood: d => d
    }
});
```

<!-- Create SeasonalTimeline plot -->
```js
const yearColors = {
  "2021": "#7fc97f",
  "2022": "#beaed4",
  "2023": "#fdc086"
};
const yearDomain = Object.keys(yearColors);
const yearRange = Object.values(yearColors);

function SeasonalTimeline(data, neighborhood, offense, firearm, year, {width} = {}) {
  // Filter data by neighborhood, offense, and firearm
  let filteredData = data.filter(d => 
    d.Neighborhood === neighborhood && 
    d.OffenseUCR === offense && 
    d.FirearmUsed === firearm
  );
  
  // Additional year filter if not "All years"
  if (year !== "All years") {
    filteredData = filteredData.filter(d => d.Year === year);
  }
  
  // Aggregate by Year and Month for both IncidentCount and IncidentMonthlyAvg
  const plotData = d3.flatRollup(
    filteredData,
    v => ({
      IncidentCount: d3.sum(v, d => d.IncidentCount),
      IncidentMonthlyAvg: d3.sum(v, d => d.IncidentMonthlyAvg)
    }),
    d => d.Year,
    d => d.Month
  ).map(([year, month, values]) => ({
    Year: year.toString(),
    Month: month,
    YearMonth: `${year}-${String(month).padStart(2, "0")}`,
    Neighborhood: neighborhood,
    OffenseUCR: offense,
    FirearmUsed: firearm,
    IncidentCount: values.IncidentCount,
    IncidentMonthlyAvg: values.IncidentMonthlyAvg
  }));

  return Plot.plot({
    width,
    height: 400,
    x: {
      domain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      tickFormat: d => new Date(2000, d - 1).toLocaleString('default', { month: 'short' }),
      label: "Month"
    },
    y: {
      grid: true
    },
    color: {
      legend: false,
      type: "ordinal",
      domain: yearDomain,
      range: yearRange
    },
    marks: [
      Plot.ruleY([0]),
      Plot.lineY(plotData, {
        x: "Month",
        y: "IncidentCount",
        z: "Year",
        stroke: "Year",
        strokeWidth: 1.5,
      }),
      Plot.crosshairX(plotData, {x: "Month", stroke: "#888", strokeWidth: 1.5, textFillOpacity: 0, textStrokeOpacity: 0}),
      Plot.dot(plotData, {
        x: "Month",
        y: "IncidentCount",
        z: "Year",
        stroke: "Year",
        fill: "white",
        r: 4,
        pointer: "x",
        strokeWidth: 2,
        opacity: 1
      }),
      Plot.lineY(plotData, {
        x: "Month",
        y: "IncidentMonthlyAvg",
        z: "Year",
        stroke: "#3C4A5B",
        strokeDasharray: "4 4",
        markerSize: 4,
        strokeWidth: 2,
        tip: true,
        title: "Average"
      }),
      Plot.tip(plotData, Plot.pointerX({
        x: "Month",
        y: "IncidentCount",
        channels: [
          {name: "Date:", value: d => d.YearMonth},
          {name: "Incidents:", value: d => d.IncidentCount},
          {name: "Average:", value: d => d.IncidentMonthlyAvg},
        ]
      }))
    ]
  });
}
```

<!-- Create FilterableTableData -->
```js
// Filter data based on selected values
function sparkbar(max) {
  return (x) => htl.html`<div style="
    background: #c7d8f7;
    color: black;
    font: 10px/1.6 var(--sans-serif);
    font-weight: 500;
    width: ${100 * x / max}%;
    float: left;
    padding-left: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: start;">${x.toLocaleString("en-US")}`
}

const filteredTableData = incidents.filter(d => 
  d.Neighborhood === selectedNeighborhood && 
  d.OffenseUCR === selectedOffense && 
  d.FirearmUsed === selectedFirearm &&
  (selectedYear === "All years" || d.Year === selectedYear)
).map(d => ({
  Neighborhood: d.Neighborhood,
  Date: d.Date,
  Month: new Date(2000, d.Month - 1).toLocaleString('default', { month: 'long' }),
  Year: d.Year,
  OffenseUCR: d.OffenseUCR,
  FirearmUsed: d.FirearmUsed,
  IncidentCount: d.IncidentCount,
  IncidentMonthlyAvg: d.IncidentMonthlyAvg
}));

const maxIncidentMonthlyAvg = Math.max(...filteredTableData.map(d => +d.IncidentMonthlyAvg || 0));
const maxIncidentCount = Math.max(...filteredTableData.map(d => +d.IncidentCount || 0));
```

<!-- Create year-over-year variables -->
```js
let filtered = incidents.filter(d =>
  d.Neighborhood === selectedNeighborhood &&
  d.OffenseUCR === selectedOffense &&
  d.FirearmUsed === selectedFirearm
);

let displayYear = selectedYear === "All years"
  ? Math.max(...filtered.map(d => d.Year))
  : selectedYear;

let previousYear = displayYear - 1;

let yoy = filtered.find(d => d.Year === displayYear)?.IncidentYoYPctChg.toFixed(1) ?? "N/A";

// let yoyChg = filtered.find(d => d.Year == displayYear)?.IncidentYoYChg ?? "N/A";

// let currYearCount = filtered.find(d => d.Year == displayYear)?.CurrYearCount ?? "N/A";

// let prevYearCount = filtered.find(d => d.Year == displayYear)?.PrevYearCount ?? "N/A";

// let currYearDiff = filtered.find(d => d.Year == displayYear)?CurrYearDiff ?? "N/A");
```

<!-- HTML page structure and text -->

<div class="hero">
  <h1>St. Louis City Crime Reports</h1>
  <h2>
    Explore neighborhood-level incident data reported by the St. Louis Metropolitan Police Department in the <a href="https://slmpd.org/stats/">National Incident-Based Reporting System</a>.
  </h2>
</div>

<div class="card" style="background: linear-gradient(120deg,rgb(212, 222, 238) 0%,rgb(225, 234, 250) 50%); border: none;">
<div style="border-bottom: solid; border-width: 1px; border-color: #A4BECE; margin-bottom: 12px; padding-bottom: 4px;">
  <h2 style="font-weight: 800; text-transform: uppercase; color:#304679;">Data Selections</h3>
  <h3 style="font-weight: 300px; font-style: italic; color:#304679;">Filter incidents by reporting characteristic using the selections below.</h3>
</div>

<!-- Data selection rows -->
<div class="selection-row">
<div>
  <label>
  Select a neighborhood
  </label>

  ```js
  // Neighborhood Select
  const neighborhoods = Array.from(new Set(incidents.map(d => d.Neighborhood))).filter(d => d !== "All neighborhoods").sort((a, b) => a.localeCompare(b));
  const selectedNeighborhood = view(Inputs.select(
    ["All neighborhoods", ...neighborhoods],
    {
      value: "All neighborhoods",
      width: 180,
    }
  ));
  ```
</div>

<div>
  <label>
  Select a calendar year
  </label>

  ```js
  // Year Select
  const selectedYear = view(Inputs.select(
    ["All years", ...new Set(incidents.map(d => d.Year))].sort((a, b) => {
      if (a === "All years") return -1;
      if (b === "All years") return 1;
      return b - a; // descending order
    }),
    {
      value: "All years",
      width: 180,
      format: d => d === "All years" ? d : d.toLocaleString('en-US', { useGrouping: false })
    }
  ));
  ```
</div>

<div>
  <label>
  Select an offense type
  </label>

  ```js
  // Offense Type Select
  const selectedOffense = view(Inputs.select(
    [...new Set(incidents.map(d => d.OffenseUCR))].sort(),
    {
      value: [...new Set(incidents.map(d => d.OffenseUCR))].sort()[0],
      width: 180,
    }
  ));
  ```
</div>

<div>
  <label>
  Select a firearm use status
  </label>

  ```js
  // Firearm Used Select
  const firearmOptions = Array.from(new Set(incidents.map(d => d.FirearmUsed))).filter(d => d !== "Yes or No").sort();
  const selectedFirearm = view(Inputs.select(
    ["Yes or No", ...firearmOptions],
    {
      value: "Yes or No",
      width: 180,
    }
  ));
  ```
</div>
</div>

</div>

<!-- Chart container -->
<div class="card">
  <div class="card-row" style="padding-bottom:12px;">
    <div class="label-area">
      <div style="border-bottom: solid; border-width: 1px; border-color: #A4BECE; margin-bottom: 8px;">
        <h2 class="section-subtitle">Number of incidents reported to St. Louis Metropolitan Police Department</h2>
      </div>
      <h3 class="section-meta">Offense Type: <strong>${selectedOffense}</h3>
      <h3 class="section-meta">Neighborhood: <strong>${selectedNeighborhood}</strong></h3>
      <h3 class="section-meta">Firearm Used: <strong>${selectedFirearm}</strong></h3>
    </div>
    <div class="kpi-card">
      <h2 class="kpi-header">Year-over-year change (${displayYear})</h2>
      <div class="kpi-row">
        <span class="big">${yoy}%</span>
        <span class="medium"><strong>${Trend(yoy)}</strong></span>
      </div>
    </div>
  </div>
  <h3 style="font-weight: 300px; font-style: italic;">Hover over a point in time to view details.</h3>
  <div class="custom-legend">
    <span class="dashed-line"></span>
    <span class="legend-label">Average</span>
    <span class="legend-line" style="border-top: 3px solid #7fc97f;"></span>
    <span class="legend-label">2021</span>
    <span class="legend-line" style="border-top: 3px solid #beaed4;"></span>
    <span class="legend-label">2022</span>
    <span class="legend-line" style="border-top: 3px solid #fdc086;"></span>
    <span class="legend-label">2023</span>
  </div>
  ${resize((width) => SeasonalTimeline(
      incidents, 
      selectedNeighborhood, 
      selectedOffense, 
      selectedFirearm,
      selectedYear,
      {width}
      ))}

  <div class="card" style="padding: 0; border: none;">
  <h3 style="margin-bottom: 8px; font-style: italic;">Select a header to sort the table by value.</h3>
  <div class="sortable-table">
      ${Inputs.table(filteredTableData, {
        sort: "Year",
        reverse: true,
        width: "100%",
        format: {
          Year: d => d.toLocaleString('en-US', { useGrouping: false }),
          IncidentMonthlyAvg: sparkbar(maxIncidentMonthlyAvg),
          IncidentCount: sparkbar(maxIncidentCount)
        },
      })}
  </div>

  <h3 style="max-width: 100%; margin-bottom: 8px; margin-top: 12px; font-style: italic;"><strong>Data Source: </strong>National Incident-Based Reporting System (NIBRS). Retrieved June 9, 2025, from <a href="https://slmpd.org/stats/">slmpd.org</a>.</h3>
</div>
  </div>
</div>

<!-- CSS styles -->
<style>

body, html {
  min-height: 100vh;
  background: linear-gradient(120deg, #e3ecfa 0%, #f7fbff 50%);
  font-family: 'Source Sans Pro', system-ui, sans-serif;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Public Sans', system-ui, sans-serif;
  margin: 4rem 0 4rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg,rgb(46, 78, 166), #22366d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 54em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

.card {
  border-radius: 4px;
}

.kpi-card {
  width: 300px;
  flex-shrink: 0; /* Prevents the card from shrinking */
  border-radius: 4px;
  padding: 12px;
  background: linear-gradient(120deg, #e3ecfa 0%, #c7d8f7 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  font-family: 'Public Sans', system-ui, sans-serif;
}

.kpi-card h2 {
  width: 100%;
  font-size: 1rem;
  font-weight: 600;
  color: #3a4a6b;
}

.kpi-card .big {
  font-size: 2.4rem;
  font-weight: 800;
  color: #2a3a5a;
  letter-spacing: -1px;
}

.kpi-card .medium {
  font-size: 1.1rem;
  font-weight: 500;
  color: #4a7bb7;
}

.kpi-card h3 {
  font-size: 0.9rem;
  font-weight: 500;
  color:rgb(62, 99, 120);
  margin: 12px 0 0 0;
}

.observablehq--block {
  margin-top: 8px;
}

/* Target the select container */
.observablehq input[type="select"],
.observablehq select,
.observablehq select option {
    background-color: #ffffff;
    border: 1px solid #A4BECE;
    border-radius: 4px;
    padding: 12px 16px;
    font-size: 18px;
    font-weight: 500;
    color: #304679;
    min-height: 50px;
    min-width: 200px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 14 20'%3e%3cpath stroke='%236c9bd1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m2 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    transition: all 0.1s ease-in-out;
}

/* Hover state */
.observablehq select:hover, select:hover {
    border-color: #5a8bc4;
}

/* Focus state */
.observablehq select:focus, select:focus {
    outline: none;
    border-color: #4a7bb7;
    box-shadow: 0 0 0 3px rgba(108, 155, 209, 0.2);
    transform: translateY(-1px);
}

/* Label styling */
label {
    font-size: 15px;
    font-weight: 500;
    display: block;
    text-transform: none;
}
.observablehq label,
label {
    font-family: 'Source Sans Pro', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: white;
    display: block;
    text-transform: none;
}

.card-row {
  display: flex;
  gap: 32px;
  width: 100%;
  justify-content: space-between;
  flex-wrap: wrap;
}

.label-area {
  flex: 1;
  min-width: 300px;
}

.section-title {
  text-transform: uppercase;
  font-weight: 800;
  margin: 0;
  padding-bottom: 4px;
}
.section-subtitle {
  padding-bottom: 4px;
  font-size: 18px;
  font-family: 'Public Sans', system-ui, sans-serif;
  font-weight: 500 !important;
}
.section-meta {
  font-size: 1.1em;
  margin: 0;
  padding-bottom: 2px;
  color: #6B8FA4;
}

th[title="IncidentCount"], th[title="IncidentMonthlyAvg"] {
  text-align: left !important;
}

/* Make the select row not wrap */
.select-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 32px;
  width: 100%;
  align-items: flex-end;
}

/* Legend */
.custom-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}
.custom-legend .dashed-line {
  display: inline-block;
  width: 32px;
  height: 0;
  border-top: 3px dashed #000;
  margin-right: 4px;
}
.custom-legend .legend-line {
  display: inline-block;
  width: 32px;
  height: 0;
  border-top: 3px solid;
  margin: 0 4px 0 16px;
}
.custom-legend .legend-label {
  font-size: 14px;
  color: #474c5f;
  margin-right: 8px;
}

.kpi-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 4px;
}

.kpi-card .kpi-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.kpi-card h3 {
  margin: 0;
}

.selection-row {
  display: flex;
  flex-wrap: wrap;
  row-gap: 12px;
  column-gap: 32px;
}

.selection-row label {
  margin-bottom: 4px;
  color: #414659;
}

.selection-row div {
  margin: 0;
}

.label-area h2 {
  font-size: 18px;

}

.sortable-table {
  border-bottom: solid;
  border-width: 2px;
  border-color:rgb(86, 103, 124);
}

</style>

<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">


