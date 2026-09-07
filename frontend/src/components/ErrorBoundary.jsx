import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('MitraScan ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f4f8f5',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1.5px solid #e1eee4',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>⚠️</span>
            <h2 style={{ margin: '0 0 8px', color: '#17231e', fontSize: '22px' }}>
              Something went wrong
            </h2>
            <p style={{ margin: '0 0 20px', color: '#526c5c', fontSize: '14px', lineHeight: '1.5' }}>
              MitraScan encountered an unexpected issue while rendering this view.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: '#fff5f5',
                border: '1px solid #ffd8d8',
                borderRadius: '8px',
                padding: '12px',
                color: '#c92a2a',
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '20px',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#167a50',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#f0f5f2',
                  color: '#2a4435',
                  border: '1px solid #cfe2d5',
                  borderRadius: '999px',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
