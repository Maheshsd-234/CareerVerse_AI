import React from "react";
import { Document, Page, Text, View, StyleSheet, Link, Font } from "@react-pdf/renderer";
import type { ResumeData, ResumeTemplateId } from "../../types/resume.types";

// Register hyphenation callback to prevent awkward word splitting
Font.registerHyphenationCallback((word) => [word]);

const cleanSimpleStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#111827",
    lineHeight: 1.45,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#12122B",
    paddingBottom: 10,
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#12122B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headline: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#4F46E5",
    marginBottom: 7,
    fontWeight: "bold",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 2,
  },
  contactItem: {
    fontSize: 8.8,
    color: "#374151",
  },
  contactSeparator: {
    fontSize: 8.8,
    color: "#9CA3AF",
    marginHorizontal: 5,
  },
  link: {
    color: "#4F46E5",
    textDecoration: "none",
  },
  section: {
    marginBottom: 13,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#12122B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: "#12122B",
    paddingBottom: 3,
    marginBottom: 7,
  },
  summaryText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.45,
  },
  entryContainer: {
    marginBottom: 9,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 9.8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  entrySubtitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Oblique",
    color: "#4B5563",
  },
  entryDate: {
    fontSize: 8.8,
    color: "#4B5563",
    fontFamily: "Helvetica",
  },
  bulletItem: {
    flexDirection: "row",
    marginTop: 2.5,
    paddingLeft: 3,
  },
  bulletPoint: {
    width: 3.5,
    height: 3.5,
    backgroundColor: "#4F46E5",
    borderRadius: 2,
    marginTop: 4.5,
    marginRight: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.8,
    color: "#374151",
    lineHeight: 1.4,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 4.5,
  },
  skillCategory: {
    width: "28%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1F2937",
  },
  skillList: {
    width: "72%",
    fontSize: 8.8,
    color: "#374151",
    lineHeight: 1.35,
  },
  projectTech: {
    fontSize: 8.5,
    color: "#4F46E5",
    fontFamily: "Helvetica",
    marginTop: 1,
    marginBottom: 2,
  },
  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  certTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1F2937",
  },
  certIssuer: {
    fontSize: 8.8,
    fontFamily: "Helvetica",
    color: "#4B5563",
  },
});

const modernMinimalStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1E293B",
    lineHeight: 1.45,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#12122B",
    marginHorizontal: -42,
    marginTop: -36,
    paddingTop: 28,
    paddingBottom: 18,
    paddingHorizontal: 42,
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headline: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#14B8A6",
    marginBottom: 8,
    fontWeight: "bold",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 2,
  },
  contactItem: {
    fontSize: 8.8,
    color: "#E2E8F0",
  },
  contactSeparator: {
    fontSize: 8.8,
    color: "#64748B",
    marginHorizontal: 5,
  },
  link: {
    color: "#93C5FD",
    textDecoration: "none",
  },
  section: {
    marginBottom: 13,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 3,
    marginBottom: 7,
  },
  summaryText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.45,
  },
  entryContainer: {
    marginBottom: 9,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 9.8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  entrySubtitle: {
    fontSize: 9,
    color: "#475569",
    fontFamily: "Helvetica-Oblique",
  },
  entryDate: {
    fontSize: 8.8,
    color: "#64748B",
  },
  bulletItem: {
    flexDirection: "row",
    marginTop: 2.5,
    paddingLeft: 3,
  },
  bulletPoint: {
    width: 3.5,
    height: 3.5,
    backgroundColor: "#14B8A6",
    borderRadius: 2,
    marginTop: 4.5,
    marginRight: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.8,
    color: "#334155",
    lineHeight: 1.4,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 4.5,
  },
  skillCategory: {
    width: "28%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#4F46E5",
  },
  skillList: {
    width: "72%",
    fontSize: 8.8,
    color: "#334155",
    lineHeight: 1.35,
  },
  projectTech: {
    fontSize: 8.5,
    color: "#4F46E5",
    fontFamily: "Helvetica",
    marginTop: 1,
    marginBottom: 2,
  },
  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  certTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  certIssuer: {
    fontSize: 8.8,
    fontFamily: "Helvetica",
    color: "#475569",
  },
});

interface Props {
  data: ResumeData;
  templateId?: ResumeTemplateId | string;
}

export const ResumePDFDocument: React.FC<Props> = ({ data, templateId = "clean-simple" }) => {
  const styles = templateId === "modern-minimal" ? modernMinimalStyles : cleanSimpleStyles;

  const {
    fullName,
    headline,
    email,
    phone,
    location,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    summary,
    education,
    skills,
    experience,
    projects,
    certifications,
  } = data;

  // Build contact items array with proper separators
  const contactElements: React.ReactNode[] = [];
  const addContact = (node: React.ReactNode) => {
    if (contactElements.length > 0) {
      contactElements.push(
        <Text key={`sep-${contactElements.length}`} style={styles.contactSeparator}>
          •
        </Text>
      );
    }
    contactElements.push(node);
  };

  if (email) {
    addContact(<Text key="email" style={styles.contactItem}>{email}</Text>);
  }
  if (phone) {
    addContact(<Text key="phone" style={styles.contactItem}>{phone}</Text>);
  }
  if (location) {
    addContact(<Text key="location" style={styles.contactItem}>{location}</Text>);
  }
  if (linkedinUrl) {
    const formattedUrl = linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`;
    addContact(
      <Text key="linkedin" style={styles.contactItem}>
        <Link src={formattedUrl} style={styles.link}>
          LinkedIn
        </Link>
      </Text>
    );
  }
  if (githubUrl) {
    const formattedUrl = githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`;
    addContact(
      <Text key="github" style={styles.contactItem}>
        <Link src={formattedUrl} style={styles.link}>
          GitHub
        </Link>
      </Text>
    );
  }
  if (portfolioUrl) {
    const formattedUrl = portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`;
    addContact(
      <Text key="portfolio" style={styles.contactItem}>
        <Link src={formattedUrl} style={styles.link}>
          Portfolio
        </Link>
      </Text>
    );
  }

  return (
    <Document title={`${fullName || "Resume"} - CareerVerse`} author={fullName || "Student"}>
      <Page size="A4" style={styles.page}>
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          {/* 1. Full Name on own line */}
          <Text style={styles.name}>{fullName || "Your Full Name"}</Text>

          {/* 2. Subtitle / Headline on own line */}
          {headline ? <Text style={styles.headline}>{headline}</Text> : null}

          {/* 3. Contact Info Row */}
          {contactElements.length > 0 ? (
            <View style={styles.contactRow}>{contactElements}</View>
          ) : null}
        </View>

        {/* PROFESSIONAL SUMMARY */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Professional Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* EDUCATION */}
        {education && education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {edu.degree}
                    {edu.branch ? ` in ${edu.branch}` : ""}
                  </Text>
                  <Text style={styles.entryDate}>
                    {edu.startYear} – {edu.endYear}
                  </Text>
                </View>
                <View style={styles.entryHeader}>
                  <Text style={styles.entrySubtitle}>{edu.institution}</Text>
                  {edu.gpa ? <Text style={styles.entryDate}>GPA/Marks: {edu.gpa}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* TECHNICAL SKILLS */}
        {skills && skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Technical Skills</Text>
            {skills.map((cat, idx) => (
              <View key={idx} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{cat.category}:</Text>
                <Text style={styles.skillList}>
                  {Array.isArray(cat.items) ? cat.items.join(", ") : cat.items}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* EXPERIENCE / INTERNSHIPS */}
        {experience && experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Experience & Internships</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.role}</Text>
                  <Text style={styles.entryDate}>{exp.duration}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{exp.company}</Text>
                {exp.bullets &&
                  exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* PROJECTS */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Key Technical Projects</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {proj.title}
                    {proj.link ? (
                      <Link
                        src={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        style={styles.link}
                      >
                        {"  "}[Project Link]
                      </Link>
                    ) : null}
                  </Text>
                  {proj.date ? <Text style={styles.entryDate}>{proj.date}</Text> : null}
                </View>

                {proj.technologies && proj.technologies.length > 0 ? (
                  <Text style={styles.projectTech}>
                    Tech: {Array.isArray(proj.technologies) ? proj.technologies.join(" | ") : proj.technologies}
                  </Text>
                ) : null}

                <Text style={styles.bulletText}>{proj.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* CERTIFICATIONS */}
        {certifications && certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Certifications & Achievements</Text>
            {certifications.map((cert, idx) => (
              <View key={idx} style={styles.certRow}>
                <Text style={styles.certTitle}>
                  {cert.name}
                  {cert.issuer ? (
                    <Text style={styles.certIssuer}> — {cert.issuer}</Text>
                  ) : null}
                </Text>
                {cert.date ? <Text style={styles.entryDate}>{cert.date}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
};
