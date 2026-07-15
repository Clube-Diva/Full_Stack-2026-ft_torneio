import { useMemo, useState } from 'react'

import TelaAdmin from './TelaTorneio/TelaAdmin'
import TelaUsuario from './TelaTorneio/TelaUsuario'

const SENHA_ADMIN = 'ft2026'

function App() {
  const [modo, setModo] = useState('usuario')
  const [erroSenha, setErroSenha] = useState('')

  const tela = useMemo(() => {
    if (modo === 'usuario') return <TelaUsuario />
    return <TelaAdmin />
  }, [modo])

  const abrirPainelAdmin = () => {
    const senhaDigitada = window.prompt('Digite a senha de administrador:')

    if (senhaDigitada === SENHA_ADMIN) {
      setModo('admin')
      setErroSenha('')
      return
    }

    setErroSenha('Senha incorreta')
    window.alert('Senha incorreta')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '16px 24px 0', alignItems: 'center' }}>
        <button type="button" onClick={() => setModo('usuario')} style={{ padding: '8px 12px', borderRadius: '8px' }}>
          Tela Usuário
        </button>

        <button
          type="button"
          onClick={abrirPainelAdmin}
          title="Acesso administrativo"
          style={{
            padding: '8px 10px',
            borderRadius: '999px',
            opacity: 0.7,
            fontSize: '0.9rem',
            border: '1px dashed rgba(255,255,255,0.3)',
          }}
        >
          🔒 Admin
        </button>
      </div>

      {erroSenha ? <p style={{ textAlign: 'center', color: '#ff9a9a', marginTop: '8px' }}>{erroSenha}</p> : null}
      {tela}
    </div>
  )
}

export default App
