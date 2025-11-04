import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, GraduationCap, Mail, Users, MapPin, Home, BookOpen, Heart } from "lucide-react";

export default function Profile({ w, profileData, setProfileData }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (profileData) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await w.get_personal_info();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [w, profileData, setProfileData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20 flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  const info = profileData?.generalinformation || {};
  const qualifications = profileData?.qualification || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20 pt-6 pb-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Personal Information */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
              Personal Information
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow label="Name" value={info.studentname} />
            <InfoRow label="Registration No" value={info.registrationno} />
            <InfoRow label="Date of Birth" value={info.dateofbirth} />
            <InfoRow label="Gender" value={info.gender} />
            <InfoRow label="Blood Group" value={info.bloodgroup} />
            <InfoRow label="Nationality" value={info.nationality} />
            <InfoRow label="Category" value={info.category} />
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">
              Academic Information
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow label="Program" value={info.programcode} />
            <InfoRow label="Branch" value={info.branch} />
            <InfoRow label="Section" value={info.sectioncode} />
            <InfoRow label="Batch" value={info.batch} />
            <InfoRow label="Semester" value={info.semester} />
            <InfoRow label="Institute" value={info.institutecode} />
            <InfoRow label="Academic Year" value={info.academicyear} />
            <InfoRow label="Admission Year" value={info.admissionyear} />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
              Contact Information
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow label="Student Email (College)" value={info.studentemailid} />
            <InfoRow label="Student Email (Personal)" value={info.studentpersonalemailid} />
            <InfoRow label="Mobile" value={info.studentcellno} />
            <InfoRow label="Telephone" value={info.studenttelephoneno || "N/A"} />
          </div>
        </div>

        {/* Family Information */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-pink-200 dark:border-pink-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
              Family Information
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow label="Father's Name" value={info.fathersname} />
            <InfoRow label="Mother's Name" value={info.mothername} />
            <InfoRow label="Parent's Email" value={info.parentemailid} />
            <InfoRow label="Parent's Mobile" value={info.parentcellno} />
            <InfoRow label="Parent's Telephone" value={info.parenttelephoneno || "N/A"} />
          </div>
        </div>

        {/* Current Address */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              Current Address
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow label="Address" value={[info.caddress1, info.caddress3].filter(Boolean).join(", ")} />
            <InfoRow label="City" value={info.ccityname} />
            <InfoRow label="District" value={info.cdistrict} />
            <InfoRow label="State" value={info.cstatename} />
            <InfoRow label="Postal Code" value={info.cpostalcode} />
          </div>
        </div>

        {/* Permanent Address */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Permanent Address
            </h2>
          </div>
          <div className="grid gap-3">
            <InfoRow
              label="Address"
              value={[info.paddress1, info.paddress2, info.paddress3].filter(Boolean).join(", ")}
            />
            <InfoRow label="City" value={info.pcityname} />
            <InfoRow label="District" value={info.pdistrict} />
            <InfoRow label="State" value={info.pstatename} />
            <InfoRow label="Postal Code" value={info.ppostalcode} />
          </div>
        </div>

        {/* Educational Qualifications */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Educational Qualifications
            </h2>
          </div>
          {qualifications.map((qual, index) => (
            <div key={index} className={`grid gap-3 ${index > 0 ? 'mt-6 pt-6 border-t border-gray-200 dark:border-gray-700' : ''}`}>
              <InfoRow label="Qualification" value={qual.qualificationcode} />
              <InfoRow label="Board" value={qual.boardname} />
              <InfoRow label="Year of Passing" value={qual.yearofpassing} />
              <InfoRow label="Marks Obtained" value={`${qual.obtainedmarks}/${qual.fullmarks}`} />
              <InfoRow label="Percentage" value={`${qual.percentagemarks}%`} />
              <InfoRow label="Division" value={qual.division} />
              {qual.grade && <InfoRow label="Grade" value={qual.grade} />}
            </div>
          ))}
        </div>

        
      </div>
    </div>
  );
}

// Helper component for consistent info display
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
      <span className="text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">{label}:</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100 break-words">{value || "N/A"}</span>
    </div>
  );
}