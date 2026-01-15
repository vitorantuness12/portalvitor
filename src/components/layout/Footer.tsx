import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Formar Ensino" className="h-10 w-10 object-contain" />
              <span className="text-xl font-display font-bold">Formar Ensino</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Transformando vidas através da educação online de qualidade.
              Cursos livres com certificado reconhecido.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Todos os Cursos
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Criar Conta
                </Link>
              </li>
              <li>
                <Link to="/validar-certificado" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Validar Certificado
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categorias</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cursos?categoria=tecnologia" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tecnologia
                </Link>
              </li>
              <li>
                <Link to="/cursos?categoria=negocios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Negócios
                </Link>
              </li>
              <li>
                <Link to="/cursos?categoria=marketing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Marketing
                </Link>
              </li>
              <li>
                <Link to="/cursos?categoria=design" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Design
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                contato@formarensino.com.br
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Formar Ensino. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
