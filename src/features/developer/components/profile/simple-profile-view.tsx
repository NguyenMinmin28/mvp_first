interface SimpleProfileViewProps {
  profile: any;
}

export function SimpleProfileView({ profile }: SimpleProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-gray-600">
                {profile.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-600">{profile.level} Developer</p>
            <p className="text-sm text-gray-500">
              {profile.experienceYears} years experience • ${profile.hourlyRate}
              /hour
            </p>
            {profile.location && (
              <p className="text-sm text-gray-500">📍 {profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill: any, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill.skillName}
            </span>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      {profile.portfolioLinks && profile.portfolioLinks.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
          <div className="space-y-2">
            {profile.portfolioLinks.map((link: string, index: number) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {profile.email && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <p className="text-gray-600">{profile.email}</p>
          {profile.whatsappNumber && (
            <p className="text-gray-600 mt-2">📱 {profile.whatsappNumber}</p>
          )}
        </div>
      )}
    </div>
  );
}
