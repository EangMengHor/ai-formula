// This file contains mock chart components to visualize data without requiring external libraries

export function Doughnut({ data, options }) {
  return (
    <div className="chart-mock doughnut-chart">
      <div className="chart-title">{options?.plugins?.title?.text || "Chart"}</div>
      <div className="chart-content">
        {data.labels.map((label, index) => (
          <div
            key={index}
            className="chart-item"
            style={{
              opacity: data.datasets[0].data[index] / Math.max(...data.datasets[0].data),
              backgroundColor: data.datasets[0].backgroundColor[index],
            }}
          >
            <span className="chart-label">{label}</span>
            <span className="chart-value">{data.datasets[0].data[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Bar({ data, options }) {
  const allValues = data.datasets.flatMap((dataset) => dataset.data)
  const maxValue = Math.max(...allValues, 1) // Prevent division by zero

  return (
    <div className="chart-mock bar-chart">
      <div className="chart-title">{options?.plugins?.title?.text || "Chart"}</div>
      <div className="chart-content">
        {data.labels.map((label, index) => (
          <div key={index} className="chart-item">
            <span className="chart-label">{label}</span>
            <div className="chart-bars">
              {data.datasets.map((dataset, i) => (
                <div
                  key={i}
                  className="chart-bar"
                  style={{
                    height: `${(dataset.data[index] / maxValue) * 100}%`,
                    backgroundColor: Array.isArray(dataset.backgroundColor)
                      ? dataset.backgroundColor[index]
                      : dataset.backgroundColor,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {options?.plugins?.legend?.display !== false && (
        <div className="chart-legend">
          {data.datasets.map((dataset, i) => (
            <div key={i} className="legend-item">
              <span
                className="legend-color"
                style={{
                  backgroundColor: Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[0]
                    : dataset.backgroundColor,
                }}
              />
              <span className="legend-label">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Radar({ data, options }) {
  return (
    <div className="chart-mock radar-chart">
      <div className="chart-title">{options?.plugins?.title?.text || "Chart"}</div>
      <div className="chart-content">
        <div className="radar-web">
          {data.labels.map((label, i) => (
            <div key={i} className="radar-axis" style={{ transform: `rotate(${i * (360 / data.labels.length)}deg)` }}>
              <span className="radar-label">{label}</span>
            </div>
          ))}
        </div>
        {data.datasets.map((dataset, i) => (
          <div
            key={i}
            className="radar-area"
            style={{
              borderColor: dataset.borderColor,
              backgroundColor: dataset.backgroundColor,
            }}
          />
        ))}
      </div>
      <div className="chart-legend">
        {data.datasets.map((dataset, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: dataset.borderColor }} />
            <span className="legend-label">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
