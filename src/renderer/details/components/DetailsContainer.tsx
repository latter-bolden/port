import React, { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LeftArrow } from '../../icons/LeftArrow'
import { RightArrow } from '../../icons/RightArrow'
import { Layout } from '../../shared/Layout'

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
                    <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
                    <span className="sr-only">Back</span>
                </Link>
            </div>
            <div className="grid grid-cols-1 w-80 text-sm">
                { children }
            </div>
            <div className="ml-12">
                <button type="submit" className="flex items-center text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white disabled:text-gray-300 dark:disabled:text-gray-700 transition-colors default-ring" disabled={buttonDisabled}>
                    Continue
                    <RightArrow className="ml-1 w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current" />
                </button>
            </div>
        </form>
    </Layout>
)