import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/icone_formak.png';
import logoText from '@/assets/logo_formak.png';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Formak" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <img src={logoText} alt="Formak" className="h-6 sm:h-8 object-contain" />
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
                contato@formak.com.br
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
            © {new Date().getFullYear()} Formak. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
