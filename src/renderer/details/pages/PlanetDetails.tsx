import React from 'react'
import { Link } from 'react-router-dom'
import { LeftArrow } from '../../icons/LeftArrow'
import { Layout } from '../../shared/Layout'
import { RouteInfo, routeMap } from '../../routes';


const BootLink = ({ route }: { route: RouteInfo }) => (
  <Link to={route.path} className="block w-full h-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded mb-5">
    <strong className="block font-semibold mb-2">{ route.heading }</strong>
    <span dangerouslySetInnerHTML={{ __html: route.description }} />
  </Link>
)


export const PlanetDetails: React.FC = () => {
  return (
    <Layout title='Boot a Planet' className="relative">
      <div className="flex items-center w-full max-w-xl">
          <div className="mr-12">
              <Link to="/" className="group focus:outline-none no-underline">
                  <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
                  <span className="sr-only">Back</span>
              </Link>
          </div>
          <div className="w-80 text-sm">
            <BootLink route={routeMap.planetKey} />
            <BootLink route={routeMap.planetInvite} />
          </div>
        </div>
    </Layout>
    )
}
