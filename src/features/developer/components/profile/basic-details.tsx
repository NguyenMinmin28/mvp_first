"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface BasicDetailsProps {
  profile: {
    name?: string;
    experienceYears?: number;
    hourlyRate?: number;
    hoursWorked?: number;
    totalEarning?: number;
    skills?: Array<{ skillName: string }>;
  };
}

export default function BasicDetails({ profile }: BasicDetailsProps) {
  return (
    <div className="relative group">
      {/* Subtle shadow effect */}
      <div className="absolute inset-0 bg-black rounded-3xl blur-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      
      <Card className="relative border-2 border-gray-200 hover:border-black shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl bg-white">
        <CardHeader className="bg-gradient-to-br from-gray-50 to-white border-b-2 border-gray-100">
          <CardTitle className="flex items-center gap-3 text-xl font-black text-gray-900">
            <div className="relative">
              <div className="absolute inset-0 bg-black rounded-xl blur-md opacity-10" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            Professional Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Stats Cards */}
            <div className="space-y-5">
              {/* Name Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</div>
                    <div className="text-lg font-black text-gray-900">{profile.name || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Experience Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Experience</div>
                    <div className="text-lg font-black text-blue-900">{profile.experienceYears || 0} Years</div>
                  </div>
                </div>
              </div>

              {/* Hourly Rate Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Hourly Rate</div>
                    <div className="text-lg font-black text-green-900">${profile.hourlyRate || 0}/hr</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Performance Cards */}
            <div className="space-y-5">
              {/* Hours Worked Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Hours Worked</div>
                    <div className="text-lg font-black text-purple-900">{profile.hoursWorked || 0} hrs</div>
                  </div>
                </div>
              </div>

              {/* Total Earning Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl hover:border-yellow-400 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Total Earnings</div>
                    <div className="text-lg font-black text-yellow-900">${(profile.totalEarning || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="group/item relative p-5 bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 rounded-2xl hover:border-gray-600 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core Skills</div>
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-200">
                            {skill.skillName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No skills listed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
