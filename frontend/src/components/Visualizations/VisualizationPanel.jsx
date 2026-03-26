import { useState } from 'react'
import { BarChart3, PieChart as PieIcon, TrendingUp, ImageOff } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts'

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                       '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

export default function VisualizationPanel({ chartData, chartType }) {
  const [activeTab, setActiveTab] = useState(chartType || 'bar')

  if (!chartData || Object.keys(chartData).length === 0) {
    return (
      <div className="viz-panel">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>Visualizations</h2>
        <div className="glass-card viz-chart-container">
          <div className="viz-empty">
            <ImageOff size={40} style={{ opacity: 0.4 }} />
            <p>No chart data yet. Ask a question to generate visualizations.</p>
          </div>
        </div>
      </div>
    )
  }

  const data = Object.entries(chartData).map(([name, value]) => ({ name, value }))

  const tabs = [
    { id: 'bar', label: 'Bar', icon: BarChart3 },
    { id: 'pie', label: 'Pie', icon: PieIcon },
    { id: 'line', label: 'Line', icon: TrendingUp },
  ]

  const tooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  }

  return (
    <div className="viz-panel">
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>Visualizations</h2>

      <div className="viz-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`viz-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} style={{ marginRight: 4 }} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card viz-chart-container">
        {activeTab === 'bar' && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" fontSize={12}
                     tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fill: 'var(--text-secondary)' }} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pie' && (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
                   outerRadius={120} innerRadius={50} paddingAngle={3}
                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                   labelLine={{ stroke: 'var(--text-tertiary)' }}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'line' && (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" fontSize={12}
                     tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fill: 'var(--text-secondary)' }} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#colorValue)" dot={{ r: 5, fill: '#6366f1' }}
                    activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
