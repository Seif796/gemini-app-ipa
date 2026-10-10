import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090a0f',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={32} color="#f87171" />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            حدث خطأ غير متوقع / Unexpected Error
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', marginBottom: '20px', lineHeight: '1.5' }}>
            {this.state.error?.message || 'تم تفادي توقف التطبيق بنجاح / The application was safely recovered.'}
          </p>

          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>إعادة تحميل التطبيق • Reload App</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

