class SalesHistoryPage {
    static async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        if (session.rol === 'CLIENTE') {
            Router.navigate('/');
            return;
        }

        LayoutHelper.render(container, 'mis-ventas');

        const template = document.getElementById('template-historial-ventas');
        if (!template) {
            console.error('Template template-historial-ventas no encontrado');
            return;
        }
        
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = '';
            pageContent.appendChild(template.content.cloneNode(true));
        }
        
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Historial de Ventas';
        
        const controller = new SalesHistoryController();
        await controller.init();
    }
}
window.SalesHistoryPage = SalesHistoryPage;
