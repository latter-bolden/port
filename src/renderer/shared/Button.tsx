import React, { FunctionComponent } from 'react'

type ButtonProps = {
    className?: string;
} & React.DOMAttributes<HTMLButtonElement>;

export const Button: FunctionComponent<ButtonProps> = ({ className = '', children, ...props }) => {

    return (
        <button className={`button ${className}`} {...props}>
            { children }
        </button>
    )
}