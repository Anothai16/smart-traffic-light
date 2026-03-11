// src/App.tsx

import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import store, { persistor } from './store'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import appConfig from '@/configs/app.config'
import './locales'
import BaseService from '@/services/BaseService' 

const environment = process.env.NODE_ENV

const SessionKicker = () => {
    useEffect(() => {
        const token = localStorage.getItem('token') || (store.getState() as any).auth?.session?.token

        if (token) {
            BaseService.get('/auth/protected-route').catch((err) => {
            })
        }
    }, [])

    return null
}

function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <BrowserRouter>
                    <SessionKicker />
                    
                    <Theme>
                        <Layout />
                    </Theme>
                </BrowserRouter>
            </PersistGate>
        </Provider>
    )
}

export default App