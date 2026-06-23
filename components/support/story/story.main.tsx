'use client';

import Image from 'next/image';

export default function ProjectCard() {
  return (
      <div className="w-full mt-0">
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
               All Stories
              </h2>
            </div>
    
    <div className="pt-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap -m-4">
          <div className="w-full md:w-1/2 lg:w-1/3 p-4">
            <div className="border border-gray-200 rounded-2xl p-8">
              <div className="flex mb-4 items-center justify-between">
                <Image
                  className="object-contain rounded-2xl h-16"
                  src="/logo.png"
                    style={{borderRadius:'20px!important'}}
                  alt="Netflix Logo"
                  width={64}
                  height={64}
                />
                <span className="py-1 px-3 rounded-md bg-blue-50 text-blue-500 text-xs font-bold uppercase">
                  In progress
                </span>
              </div>

              <div className="pb-6 border-b border-gray-200">
                <h6 className="text-blue-900 font-semibold mb-1">
                  Netflix - Streaming Platform
                </h6>
                <p className="text-gray-500 text-sm">Production company</p>
              </div>

              {/* Start Date */}
              <div className="flex mb-6 pt-6 justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon />
                  <span className="text-gray-500 text-sm">Start date</span>
                </div>
                <span className="text-gray-500 text-sm font-medium">
                  22 May, 2021
                </span>
              </div>

          

              {/* Avatars */}
              
              {/* Progress Bar */}
              <div className="relative bg-blue-50 rounded-2xl h-1 w-full">
                <div className="absolute top-0 bottom-0 bg-blue-500 rounded-2xl w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
const CalendarIcon = () => (
    <svg className="mr-3" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.4545 4H2.54545C2.24421 4 2 4.20351 2 4.45455V13.5455C2 13.7965 2.24421 14 2.54545 14H13.4545C13.7558 14 14 13.7965 14 13.5455V4.45455C14 4.20351 13.7558 4 13.4545 4Z" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 2V4" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 2V4" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 7.5H13.5" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  
  const DueDateIcon = () => (
    <svg className="mr-3" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.4545 4H2.54545C2.24421 4 2 4.20351 2 4.45455V13.5455C2 13.7965 2.24421 14 2.54545 14H13.4545C13.7558 14 14 13.7965 14 13.5455V4.45455C14 4.20351 13.7558 4 13.4545 4Z" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 2V3" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 2V3" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8L7 10" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10L7 8" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  
  const UpdateIcon = () => (
    <svg className="mr-3" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4.98956 6.23224H1.98956V3.23224" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.8891 4.11091C11.3783 3.60019 10.772 3.19506 10.1047 2.91866C9.43744 2.64226 8.72224 2.5 7.99997 2.5C7.2777 2.5 6.5625 2.64226 5.89521 2.91866C5.22792 3.19506 4.6216 3.60019 4.11088 4.11091L1.98956 6.23223" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.0104 9.76776H14.0104V12.7678" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.1109 11.8891C4.62162 12.3998 5.22794 12.8049 5.89523 13.0813C6.56252 13.3577 7.27772 13.5 7.99999 13.5C8.72226 13.5 9.43746 13.3577 10.1047 13.0813C10.772 12.8049 11.3784 12.3998 11.8891 11.8891L14.0104 9.76776" stroke="#7A899B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  
  const PlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  
  const DotsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13.5 11.5C14.3284 11.5 15 10.8284 15 10C15 9.17157 14.3284 8.5 13.5 8.5C12.6716 8.5 12 9.17157 12 10C12 10.8284 12.6716 11.5 13.5 11.5Z" fill="#7A899B" />
      <path d="M6.5 11.5C7.32843 11.5 8 10.8284 8 10C8 9.17157 7.32843 8.5 6.5 8.5C5.67157 8.5 5 9.17157 5 10C5 10.8284 5.67157 11.5 6.5 11.5Z" fill="#7A899B" />
    </svg>
  );
  