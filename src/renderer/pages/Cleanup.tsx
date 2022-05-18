import React from 'react';
import { Layout } from '../shared/Layout';
import { Spinner } from '../shared/Spinner';


export const Cleanup = () => {
    return (
        <Layout 
            title="Quit"
            center={false}
            className="relative flex justify-center items-center min-content-area-height"
        >
            <div className="flex items-center">
                <Spinner className="h-24 w-24 mr-6" />
                <div className="flex-1">
                    <h1 className="font-semibold">Cleaning up...</h1>
                    <div className="text-gray-300 dark:text-gray-600">This may take a bit.</div>
                </div>
            </div>
        </Layout>
    )
}