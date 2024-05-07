'use client'
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserButton } from "@clerk/nextjs";
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getWalletBalance } from '../../../../utils/user-requests';

export default function AdminNavbarComponent() {
  const [currentPage, setCurrentPage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { userId, getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setCurrentPage(window.location.pathname); // Set the current page when component mounts
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (isSignedIn) {
          const balance = await getWalletBalance({ userId });
          setWalletBalance(balance);
        } else {
          setWalletBalance(null);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(null);
      }
    };

    fetchWallet();
  }, [isSignedIn, getToken, userId]);


  return (
    <Disclosure as="nav" className="bg-black shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 justify-between">
              <div className="absolute inset-y-0 text-white left-0 flex items-center sm:hidden">
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2  ">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <a
                    href='/admin/manage-users'
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/admin/manage-users' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    Manage users
                  </a>
                  <a
                    href='/admin/add-activities-and-coaches'
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/admin/add-activities-and-coaches' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    Manage coaches and activities
                  </a>
                  <a
                    href="/admin/view-reservations"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/admin/view-reservations' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    View reservations
                  </a>
                  <a
                    href="/admin/add-timeslots"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/admin/add-timeslots' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    Add time slots
                  </a>
                  <a
                    href="/admin/book-for-client"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/admin/book-for-client' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    Book for client
                  </a>
                  <a
                    href='/users/dashboard'
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentPage === '/users/dashboard' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent'} `}
                  >
                    User dashboard
                  </a>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {walletBalance !== null && (
                  <div className="text-white mr-4">{walletBalance} credits</div>
                )}
                <UserButton afterSignOutUrl='/' />
              </div>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-4 pt-2">
              <a
                href="/admin/manage-users"
                className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/admin/manage-users' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
              >
                Manage users
              </a>
              <a
                href="/admin/add-activities-and-coaches"
                className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/admin/add-activities-and-coaches' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
              >
                Manage coaches and activities
              </a>
              <a
                href="/admin/view-reservations"
                className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/admin/view-reservations' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
              >
                View reservations
              </a>
              <a
                href="/admin/add-timeslots"
                className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/admin/add-timeslots' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
              >
                Add time slots
              </a>
              <a
                href="/admin/book-for-client"
                className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/admin/book-for-client' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
              >
                Book for client
              </a>
              <a
                    href='/users/dashboard'
                    className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${currentPage === '/users/dashboard' ? 'text-white bg-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent'} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}
                  >
                    User dashboard
                  </a>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
