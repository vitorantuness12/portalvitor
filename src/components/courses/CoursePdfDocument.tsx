import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    color: '#1a1a1a',
  },
  coverPage: {
    paddingTop: 200,
    paddingBottom: 50,
    paddingHorizontal: 80,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0d9488',
  },
  coverDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#555555',
    marginBottom: 30,
  },
  coverMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  coverMetaBlock: {
    marginHorizontal: 15,
  },
  coverMetaItem: {
    fontSize: 10,
    color: '#777777',
    textAlign: 'center',
  },
  coverMetaValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    textAlign: 'center',
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: '#0d9488',
    marginTop: 25,
    marginBottom: 25,
    marginLeft: 175,
  },
  coverInstitution: {
    fontSize: 10,
    color: '#999999',
    marginTop: 40,
    textAlign: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#0d9488',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  paragraph: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 8,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 25,
    right: 50,
    color: '#aaaaaa',
  },
  header: {
    position: 'absolute',
    fontSize: 8,
    top: 25,
    left: 50,
    right: 50,
    color: '#cccccc',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    paddingBottom: 5,
  },
});

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

function splitIntoParagraphs(text: string): string[] {
  const cleaned = stripMarkdown(text);
  const paragraphs = cleaned
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Break long paragraphs into smaller chunks to avoid layout engine overflow
  const result: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= 500) {
      result.push(para);
    } else {
      // Split at sentence boundaries within the limit
      const sentences = para.split(/(?<=[.!?])\s+/);
      let chunk = '';
      for (const sentence of sentences) {
        if (chunk.length + sentence.length > 500 && chunk.length > 0) {
          result.push(chunk.trim());
          chunk = '';
        }
        chunk += (chunk ? ' ' : '') + sentence;
      }
      if (chunk.trim()) {
        result.push(chunk.trim());
      }
    }
  }
  return result;
}

export function CoursePdfDocument({ title, description, level, durationHours, modules }: CoursePdfDocumentProps) {
  const levelLabel = level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado';

  return (
    <Document>
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverDescription}>{description}</Text>
        <View style={styles.coverMeta}>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaValue}>{durationHours}h</Text>
            <Text style={styles.coverMetaItem}>Duração</Text>
          </View>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaValue}>{levelLabel}</Text>
            <Text style={styles.coverMetaItem}>Nível</Text>
          </View>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaValue}>{String(modules.length)}</Text>
            <Text style={styles.coverMetaItem}>Módulos</Text>
          </View>
        </View>
        <Text style={styles.coverInstitution}>FORMAK - Cursos Livres</Text>
      </Page>

      {modules.map((mod, index) => (
        <Page key={index} size="A4" style={styles.page} wrap>
          <Text style={styles.header} fixed>{title}</Text>
          <Text style={styles.moduleTitle}>
            {`Módulo ${index + 1}: ${mod.title}`}
          </Text>
          {splitIntoParagraphs(mod.content).map((para, pIdx) => (
            <Text key={pIdx} style={styles.paragraph} wrap>
              {para}
            </Text>
          ))}
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
