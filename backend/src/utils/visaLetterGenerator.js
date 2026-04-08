import PDFDocument from 'pdfkit';
import { uploadToCloudinary } from './uploader.js';
import { PassThrough } from 'stream';

/**
 * Generate Medical Visa Request Letter PDF
 * Creates a professional PDF with medical information and supporting details
 */

export const generateMedicalVisaLetterContent = (userData, medicalInfo, treatmentDetails) => {
    const today = new Date();
    const letterDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const letterContent = `
# MEDICAL VISA REQUEST LETTER

**Date:** ${letterDate}

**To Whom It May Concern,**

---

## APPLICANT INFORMATION

**Full Name:** ${userData.firstName} ${userData.lastName}  
**Date of Birth:** ${userData.age ? `Age ${userData.age}` : 'Not specified'}  
**Gender:** ${userData.gender || 'Not specified'}  
**Nationality:** ${userData.country || 'Not specified'}  
**Email:** ${userData.email}  
**Phone:** ${userData.phone || 'Not provided'}  

---

## MEDICAL CONDITION & TREATMENT DETAILS

This letter is to certify that the above-named patient requires urgent medical treatment abroad and is seeking a medical visa for the following reasons:

### Primary Conditions:
${medicalInfo.conditions && medicalInfo.conditions.length > 0
    ? medicalInfo.conditions.map((c) => `- ${c}`).join('\n')
    : '- As per medical evaluation'}

### Current Symptoms:
${medicalInfo.symptoms && medicalInfo.symptoms.length > 0
    ? medicalInfo.symptoms.map((s) => `- ${s}`).join('\n')
    : '- Under medical review'}

### Blood Group: ${medicalInfo.bloodGroup || 'Not specified'}

### Medications:
${medicalInfo.medications && medicalInfo.medications.length > 0
    ? medicalInfo.medications.map((m) => `- ${m}`).join('\n')
    : '- As prescribed by treating physician'}

### Allergies:
${medicalInfo.allergies && medicalInfo.allergies.length > 0
    ? medicalInfo.allergies.map((a) => `- ${a}`).join('\n')
    : '- No known allergies reported'}

---

## TREATMENT & HOSPITAL DETAILS

**Hospital/Medical Facility:** ${treatmentDetails.hospital || 'To be determined'}  
**Consulting Physician:** ${treatmentDetails.doctor || 'Specialist'}  
**Treatment Plan:** ${treatmentDetails.treatment || 'Specialized medical intervention'}  
**Estimated Treatment Duration:** ${treatmentDetails.estimatedDuration || '2-4 weeks'}  
**Estimated Treatment Cost:** ${treatmentDetails.estimatedCost ? `${treatmentDetails.currency || 'USD'} ${treatmentDetails.estimatedCost.toLocaleString()}` : 'As per hospital quotation'}

---

## PURPOSE OF VISIT

The patient requires specialized medical treatment that is not readily available in their home country or requires treatment at a specialized medical facility. This medical visa is necessary for:

1. Comprehensive medical evaluation and diagnosis
2. Advanced therapeutic interventions and surgical procedures
3. Specialized post-operative care and rehabilitation
4. Access to advanced medical technology and expertise

---

## DECLARATION

This letter certifies that the applicant has a genuine medical need to travel abroad for treatment. The applicant is:

- Medically fit to travel
- Under medical supervision and care
- Following all prescribed medical protocols
- Financially capable of meeting treatment and accommodation expenses

---

## SUPPORTING DOCUMENTATION

The following medical documents are attached to support this application:

1. Medical diagnostic reports and test results
2. Prescriptions and medical records
3. Physician's recommendations
4. Hospital appointment confirmation (if available)
5. Proof of financial means for treatment

---

## CONTACT INFORMATION

For any inquiries regarding this letter, please contact:

**Patient Email:** ${userData.email}  
**Patient Phone:** ${userData.phone || 'Contact through designated representative'}

---

**Authorized By:**  
HealTrip Medical Verification System  
${letterDate}

---

*This letter is issued for the specific purpose of visa application and should be presented to the relevant immigration authorities. It is based on information provided by the applicant and medical records on file.*

**Confidentiality Notice:** This letter contains confidential medical information and should be handled accordingly.
`;

    return letterContent;
};

/**
 * Generate PDF from letter content
 * @param {string} letterContent - Markdown or plain text content
 * @param {Object} userData - User details for letter
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generatePDFBuffer = async (letterContent, userData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
        });

        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('MEDICAL VISA REQUEST LETTER', {
            align: 'center',
        });

        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica')
            .text(`Generated on: ${new Date().toLocaleDateString()}`, {
                align: 'center',
            });

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Parse and render content
        const lines = letterContent.split('\n');
        let inList = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === '') {
                doc.moveDown(0.3);
                continue;
            }

            if (trimmedLine.startsWith('# ')) {
                doc.fontSize(14).font('Helvetica-Bold').text(trimmedLine.replace('# ', ''));
                doc.moveDown(0.3);
                inList = false;
            } else if (trimmedLine.startsWith('## ')) {
                doc.moveDown(0.2);
                doc.fontSize(12).font('Helvetica-Bold').text(trimmedLine.replace('## ', ''));
                doc.moveDown(0.2);
                inList = false;
            } else if (trimmedLine.startsWith('### ')) {
                doc.fontSize(11).font('Helvetica-Bold').text(trimmedLine.replace('### ', ''));
                doc.moveDown(0.2);
                inList = false;
            } else if (trimmedLine.startsWith('- ')) {
                doc.fontSize(10).font('Helvetica').text(trimmedLine.replace('- ', ''), {
                    indent: 20,
                });
                inList = true;
            } else if (trimmedLine.includes(':')) {
                // Format bold labels
                const [label, ...rest] = trimmedLine.split(':');
                const value = rest.join(':').trim();

                doc.fontSize(10).font('Helvetica-Bold').text(label + ':', { continued: true });
                doc.font('Helvetica').text(' ' + value);
                doc.moveDown(0.2);
                inList = false;
            } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                doc.fontSize(10).font('Helvetica-Bold').text(trimmedLine.replace(/\*\*/g, ''));
                doc.moveDown(0.2);
                inList = false;
            } else {
                doc.fontSize(10).font('Helvetica').text(trimmedLine, {
                    align: 'justify',
                });
                doc.moveDown(0.2);
                inList = false;
            }

            // Add page break if needed
            if (doc.y > 750) {
                doc.addPage();
            }
        }

        // Footer
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica-Italic').text('This letter is issued for visa application purposes.', {
            align: 'center',
        });

        doc.end();
    });
};

/**
 * Upload PDF to Cloudinary
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} fileName - File name for the PDF
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadPDFToCloudinary = async (pdfBuffer, fileName) => {
    try {
        const result = await uploadToCloudinary(pdfBuffer, 'healtrip/visa-letters', 'raw');
        return result;
    } catch (error) {
        throw new Error(`Failed to upload PDF: ${error.message}`);
    }
};

/**
 * Complete letter generation workflow
 * @param {Object} userData - User data
 * @param {Object} medicalInfo - Medical information
 * @param {Object} treatmentDetails - Treatment details
 * @returns {Promise<Object>} - { letterContent, pdfUrl, publicId }
 */
export const generateMedicalVisaLetter = async (userData, medicalInfo, treatmentDetails) => {
    try {
        // Generate letter content
        const letterContent = generateMedicalVisaLetterContent(userData, medicalInfo, treatmentDetails);

        // Generate PDF
        const pdfBuffer = await generatePDFBuffer(letterContent, userData);

        // Upload to Cloudinary
        const uploadResult = await uploadPDFToCloudinary(
            pdfBuffer,
            `visa-letter-${userData._id}-${Date.now()}.pdf`
        );

        return {
            letterContent,
            pdfUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileSize: uploadResult.bytes,
            uploadedAt: new Date(),
        };
    } catch (error) {
        throw new Error(`Failed to generate medical visa letter: ${error.message}`);
    }
};
