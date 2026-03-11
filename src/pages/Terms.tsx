import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  { title: '1. Purpose of the Platform', body: 'Canoe Health is a digital health platform designed to improve access to healthcare in Uganda by enabling patients to connect with licensed healthcare professionals through secure mobile and web-based telehealth services.\n\nThe platform facilitates:\n• Remote medical consultations\n• Appointment scheduling\n• Secure patient-provider communication\n• Payment processing for consultations\n• Feedback and quality monitoring\n\nCanoe Health does not replace traditional healthcare services, and Providers remain fully responsible for their clinical decisions and patient care.' },
  { title: '2. Eligibility Requirements for Providers', body: 'To provide services through Canoe Health, you must:\n• Be a licensed medical practitioner in Uganda\n• Hold valid registration with the Uganda Medical and Dental Practitioners Council (UMDPC) or other relevant regulatory body\n• Maintain professional indemnity insurance where required\n• Provide accurate credentials including medical degree, license number, and specialty qualifications\n• Comply with all applicable laws and regulations governing medical practice in Uganda\n\nCanoe Health reserves the right to verify credentials and suspend or terminate accounts where verification cannot be completed.' },
  { title: '3. Provider Responsibilities', body: 'Providers using Canoe Health agree to:\n\n3.1 Deliver Professional Medical Care\nProvide medical consultations that meet accepted standards of care and professional ethics.\n\n3.2 Maintain Professional Conduct\nTreat all patients respectfully and professionally regardless of gender, age, religion, ethnicity, or socioeconomic status.\n\n3.3 Clinical Judgment\nProviders retain full responsibility for medical advice, diagnosis, treatment decisions, and determining when telehealth is appropriate. Providers must refer patients for in-person care when necessary.' },
  { title: '4. Telehealth Practice Standards', body: 'Providers must follow recognized telemedicine best practices, including:\n• Verifying patient identity\n• Confirming patient consent for telehealth services\n• Conducting consultations in a private and secure environment\n• Documenting key clinical information appropriately\n\nProviders should not conduct consultations when a physical examination is medically required, the case presents a medical emergency, or the technology environment is not secure.' },
  { title: '5. Availability and Scheduling', body: 'Providers may choose their own availability within the Canoe Health platform. Providers agree to honor scheduled consultation times, notify Canoe Health of planned absences, and avoid repeated cancellations or missed consultations. Canoe Health may monitor availability metrics to maintain service quality.' },
  { title: '6. Payments and Fees', body: 'Canoe Health facilitates payment collection from patients for consultations. Providers will receive compensation based on consultation fees set on the platform and revenue sharing arrangements agreed with Canoe Health. Payments will be processed through approved digital payment channels including mobile money, digital wallets, and bank transfers.' },
  { title: '7. Patient Data and Confidentiality', body: 'Providers must maintain strict confidentiality of patient information. All patient data accessed through Canoe Health must be handled in accordance with the Uganda Data Protection and Privacy Act (2019), medical confidentiality standards, and Canoe Health privacy policies. Providers must not download, copy, or store patient data outside the platform unless legally required.' },
  { title: '8. Technology Use', body: 'Providers agree to use the Canoe Health platform responsibly and in accordance with platform policies. Providers must use secure internet connections, maintain updated devices and software, and protect login credentials. Providers must not attempt to bypass platform security or misuse the system.' },
  { title: '9. Prohibited Activities', body: 'Providers may not:\n• Provide fraudulent medical credentials\n• Harass or discriminate against patients\n• Conduct consultations outside the platform after connecting with a patient through Canoe Health\n• Misuse patient information\n• Engage in unethical medical practices\n\nViolations may result in suspension or termination.' },
  { title: '10. Quality Monitoring', body: 'Canoe Health may monitor service quality through patient feedback, consultation metrics, and platform performance analytics. Providers agree to cooperate with reasonable quality improvement measures.' },
  { title: '11. Suspension and Termination', body: 'Canoe Health may suspend or terminate a Provider account if licensing requirements are no longer met, professional misconduct occurs, platform policies are violated, or regulatory authorities require action. Providers may terminate their participation by providing written notice.' },
  { title: '12. Liability', body: 'Providers are independent healthcare professionals and remain responsible for the clinical services they provide. Canoe Health acts solely as a technology platform connecting patients and providers. Canoe Health does not assume responsibility for medical advice given by Providers, clinical outcomes, or Provider malpractice.' },
  { title: '13. Governing Law', body: 'These Terms shall be governed by the laws of The Republic of Uganda. Any disputes arising from these Terms shall be resolved through the appropriate courts or dispute resolution mechanisms in Uganda.' },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Provider Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-2">Last Updated: 1st April 2026</p>
        <p className="text-gray-600 mt-4 leading-relaxed">
          These Provider Terms of Service govern the relationship between Canoe Health Ltd. and healthcare professionals who use the Canoe Health digital platform to provide telehealth consultations and related services to patients.
        </p>
        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 p-4 bg-primary-light rounded-lg text-sm text-gray-600">
          For questions regarding these Terms, contact <strong>support@canoehealthcare.com</strong>
        </div>
      </div>
    </div>
  );
}
