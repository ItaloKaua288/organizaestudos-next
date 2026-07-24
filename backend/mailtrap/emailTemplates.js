export const VERIFICATION_EMAIL_TEMPLATE = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; line-height: 1.6; color: #374151;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <h2 style="margin-top: 0; color: #111827; font-size: 24px; font-weight: 600;">Verifique seu email</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
                Obrigado por se registrar! Para começar a gerenciar seus estudos, por favor, utilize o código de verificação abaixo:
            </p>
            
            <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">{@verification_token@}</span>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                <svg style="vertical-align: middle; margin-right: 4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Este código é válido por <strong>10 minutos</strong>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                Se você não criou uma conta ou não solicitou este email, pode ignorá-lo com segurança.
            </p>
            
        </div>
    </div>
`;


export const WELCOME_EMAIL_TEMPLATE = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; line-height: 1.6; color: #374151;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <h2 style="margin-top: 0; color: #111827; font-size: 24px; font-weight: 600;">Bem-vindo(a) aos seus estudos!</h2>
            
            <p style="font-size: 16px; color: #4b5563;">Olá <strong>{@user_name@}</strong>,</p>
            
            <p style="font-size: 16px; color: #4b5563;">
                Que bom ter você por aqui! Agora você tem todas as ferramentas que precisa para organizar suas matérias, acompanhar seu progresso e alcançar seus objetivos de estudo.
            </p>
            
            <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 15px; color: #374151; display: flex; align-items: center;">
                    <svg style="vertical-align: middle; margin-right: 8px;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                    <strong style="display: contents;">Dica rápida:</strong> Comece cadastrando suas matérias e montando seu cronograma da semana no painel!
                </p>
            </div>
            
            <p style="font-size: 16px; color: #4b5563;">
                Explore nossos recursos e, se tiver qualquer dúvida, é só responder a este email.
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-top: 32px; margin-bottom: 0;">
                Bons estudos
            </p>
            
        </div>
    </div>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; line-height: 1.6; color: #374151;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <h2 style="margin-top: 0; color: #111827; font-size: 24px; font-weight: 600;">Redefinição de Senha</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, clique no botão abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="{@reset_url@}" style="background-color: #111827; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s;">Redefinir Senha</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                <svg style="vertical-align: middle; margin-right: 4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Por motivos de segurança, este link é válido por <strong>1 hora</strong>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                Se você não solicitou a alteração de senha, pode ignorar este email com segurança. Sua senha atual continuará a mesma.
            </p>
            
        </div>
    </div>
`;

export const PASSWORD_RESET_CONFIRMATION_TEMPLATE = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; line-height: 1.6; color: #374151;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <h2 style="margin-top: 0; color: #111827; font-size: 24px; font-weight: 600;">Senha alterada com sucesso</h2>
            
            
            <p style="font-size: 16px; color: #4b5563;">
                Estamos enviando este email apenas para confirmar que a senha da sua conta foi redefinida com sucesso. Você já pode fazer login utilizando suas novas credenciais.
            </p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 15px; color: #166534; display: flex; align-items: center;">
                    <svg style="vertical-align: middle; margin-right: 8px; min-width: 20px;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <strong>Conta segura e atualizada!</strong>
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                <strong>Aviso de segurança:</strong> Se você não realizou esta alteração, por favor, entre em contato com nossa equipe de suporte imediatamente para protegermos sua conta.
            </p>
            
        </div>
    </div>
`;