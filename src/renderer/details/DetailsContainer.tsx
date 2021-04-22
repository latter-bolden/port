import React, { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'

interface DetailsContainerProps {
    title: string;
    buttonDisabled: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const DetailsContainer: React.FC<DetailsContainerProps> = ({ title, onSubmit, buttonDisabled, children }) => (
    <Layout title={title} className="relative">            
        <form className="flex items-center w-full max-w-xl" onSubmit={onSubmit}>
            <div className="mr-12">
                <Link to="/" className="group focus:outline-none no-underline">
                    <LeftArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors"/>
                    <span className="sr-only">Back</span>
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 w-80 text-sm">
                { children }
            </div>
            <div className="ml-12">
                <button type="submit" className="flex items-center text-gray-500 hover:text-white focus:text-white disabled:text-gray-700 transition-colors" disabled={buttonDisabled}>
                    Continue
                    <RightArrow className="ml-1 w-7 h-7" secondary="fill-current" />
                </button>
            </div>
        </form>
    </Layout>
)