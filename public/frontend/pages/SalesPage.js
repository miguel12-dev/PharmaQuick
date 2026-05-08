class SalesPage {
    static async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        LayoutHelper.render(container, 'ventas');

        const template = document.getElementById('template-ventas');
        if (!template) {
            console.error('Template template-ventas no encontrado');
            return;
        }
        
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = '';
            pageContent.appendChild(template.content.cloneNode(true));
        }
        
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Punto de Venta (POS)';
        
        const controller = new SalesController();
        await controller.init();
    }
}
window.SalesPage = SalesPage;
