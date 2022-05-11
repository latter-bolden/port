import React from 'react';
import { Layout } from '../shared/Layout';
import { Spinner } from '../shared/Spinner';


export const Cleanup = () => {
    return (
        <Layout 
            title="Quit"
            center={false}
        >
            <div className="grid h-full w-full justify-center items-center">
                <h1 className="text-2xl mt-8 text-center">Cleaning up...</h1>
                <Spinner className="h-24 w-24" />
            </div>
        </Layout>
    )
}