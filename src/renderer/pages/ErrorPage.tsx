import React, { FunctionComponent } from 'react'
import { FallbackProps } from 'react-error-boundary'
import { Layout } from '../shared/Layout'

export const ErrorPage: FunctionComponent<FallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <Layout title={error.name} className="p-4">
            <section className="w-full max-w-2xl mx-auto space-y-4">
                <h1>
                    <span className="font-semibold text-red-500">{ error.name }:</span>
                    <span className="text-base ml-2">{ error.message }</span>
                </h1>
                <p className="text-xs max-w-full overflow-x-auto text-gray-400">
                    <pre>
                        { error.stack }
                    </pre>
                </p>
            </section>
        </Layout>
    )
}