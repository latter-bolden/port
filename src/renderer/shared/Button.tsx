import React, { FunctionComponent } from 'react'

type ButtonProps = {

} & React.DOMAttributes<HTMLButtonElement>;

export const Button: FunctionComponent<ButtonProps> = ({ children, ...props }) => {

    return (
        <button className="button" {...props}>
            { children }
        </button>
    )
}