import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

interface Module {
  title: string;
  content: string;
}

interface CoursePdfDocumentProps {
  title: string;
  description: string;
  level: string;
  durationHours: number;
  modules: Module[];
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  coverPage: {
    padding: 50,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0d9488',
  },
  coverDescription: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
    maxWidth: 400,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 10,
  },
  coverMetaItem: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
  },
  coverMetaValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: '#0d9488',
    marginVertical: 25,
  },
  coverInstitution: {
    fontSize: 10,
    color: '#999',
    marginTop: 40,
  },
  moduleTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#0d9488',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  moduleContent: {
    fontSize: 11,
    lineHeight: 1.7,
    color: '#333',
    textAlign: 'justify',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 25,
    right: 50,
    color: '#aaa',
  },
  header: {
    position: 'absolute',
    fontSize: 8,
    top: 25,
    left: 50,
    right: 50,
    color: '#ccc',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
});

// Strip markdown formatting for PDF
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function CoursePdfDocument({ title, description, level, durationHours, modules }: CoursePdfDocumentProps) {
  const levelLabel = level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado';

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverDescription}>{description}</Text>
        <View style={styles.coverMeta}>
          <View>
            <Text style={styles.coverMetaValue}>{durationHours}h</Text>
            <Text style={styles.coverMetaItem}>Duração</Text>
          </View>
          <View>
            <Text style={styles.coverMetaValue}>{levelLabel}</Text>
            <Text style={styles.coverMetaItem}>Nível</Text>
          </View>
          <View>
            <Text style={styles.coverMetaValue}>{modules.length}</Text>
            <Text style={styles.coverMetaItem}>Módulos</Text>
          </View>
        </View>
        <Text style={styles.coverInstitution}>FORMAK - Cursos Livres</Text>
      </Page>

      {/* Module Pages */}
      {modules.map((module, index) => (
        <Page key={index} size="A4" style={styles.page} wrap>
          <Text style={styles.header} fixed>{title}</Text>
          <Text style={styles.moduleTitle}>
            Módulo {index + 1}: {module.title}
          </Text>
          <Text style={styles.moduleContent}>
            {stripMarkdown(module.content)}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}
