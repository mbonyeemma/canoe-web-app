import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  { title: '1. Information We Collect', body: '1.1 Personal Information\nWe may collect personal information including full name, date of birth, gender, phone number, email address, national ID number (where required), address or location information, and emergency contact information.\n\n1.2 Health and Medical Information\nWhen using Canoe Health services, patients may provide health-related information including symptoms and medical history, allergies or medications, consultation notes and communications, and uploaded images or documents related to medical care. This information is considered sensitive personal data under Ugandan law.\n\n1.3 Device and Technical Information\nWe may automatically collect certain technical information including device type, operating system, IP address, app usage data, and login timestamps.\n\n1.4 Payment Information\nIf payments are made through the platform, we may collect limited billing information such as payment confirmation data, mobile money transaction references, and payment provider details. Canoe Health does not store full financial account details.' },
  { title: '2. How We Use Your Information', body: '2.1 Providing Healthcare Services\nTo enable patients to connect with licensed healthcare providers, schedule consultations, participate in video consultations, and receive healthcare advice.\n\n2.2 Improving Healthcare Quality\nTo improve clinical services and user experience by analyzing platform usage, service performance, and patient feedback.\n\n2.3 Platform Operations\nTo maintain system security, prevent fraud or misuse, and provide technical support.\n\n2.4 Legal and Regulatory Compliance\nTo comply with applicable laws, regulations, and healthcare standards in Uganda.' },
  { title: '3. Legal Basis for Processing Data', body: 'Canoe Health processes personal data based on patient consent when registering and using the platform, provision of healthcare services, legal obligations under Ugandan law, and legitimate interest in maintaining secure and effective healthcare systems.' },
  { title: '4. Sharing of Information', body: '4.1 Licensed Healthcare Providers\nPatient information may be shared with healthcare providers participating on the Canoe Health platform to enable clinical consultations.\n\n4.2 Service Providers\nWe may share limited information with trusted third parties who assist us with cloud hosting, payment processing, video communication services, and technical infrastructure. All such providers are required to maintain strict confidentiality.\n\n4.3 Legal Requirements\nInformation may be disclosed when required by law, including court orders, regulatory investigations, and public health reporting requirements.\n\n4.4 Emergency Situations\nWhere necessary to prevent serious harm to a patient or others.' },
  { title: '5. Data Security', body: 'Canoe Health implements strong safeguards to protect patient data. Security measures include end-to-end encryption for communications, secure servers and cloud infrastructure, access control and authentication systems, and regular security monitoring. Despite these protections, no digital system can guarantee absolute security.' },
  { title: '6. Data Storage and Retention', body: 'Patient information is stored only for as long as necessary to provide healthcare services, meet legal or regulatory requirements, and resolve disputes or enforce agreements. Healthcare records may be retained according to Ugandan medical record retention standards.' },
  { title: '7. Your Privacy Rights', body: 'Patients using Canoe Health have the following rights under the Uganda Data Protection and Privacy Act:\n• Access your personal data\n• Request correction of inaccurate information\n• Request deletion of certain information where legally permitted\n• Withdraw consent to data processing\n• Object to certain data uses\n\nRequests can be made by contacting Canoe Health.' },
  { title: '8. Children\'s Privacy', body: 'Canoe Health services are intended for individuals 18 years and older. For minors, the platform may only be used with the consent of a parent or legal guardian.' },
  { title: '9. Cross-Border Data Transfers', body: 'Where necessary, Canoe Health may process data using secure international cloud providers. All such transfers comply with Uganda\'s data protection requirements to ensure patient privacy is maintained.' },
  { title: '10. Changes to This Privacy Policy', body: 'Canoe Health may update this Privacy Policy periodically to reflect changes in technology, regulatory updates, and improvements to our services. When updates occur, the revised policy will be posted on the Canoe Health platform.' },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Patient Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-2">Effective Date: 1st April 2026</p>
        <p className="text-gray-600 mt-4 leading-relaxed">
          Canoe Health is committed to protecting the privacy and confidentiality of patient information. This Privacy Policy explains how we collect, use, disclose, store, and protect personal and health information when individuals use the Canoe Health platform. This policy is designed to comply with the Uganda Data Protection and Privacy Act, 2019.
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
          Questions about this policy? Contact <strong>support@canoehealthcare.com</strong>
        </div>
      </div>
    </div>
  );
}
