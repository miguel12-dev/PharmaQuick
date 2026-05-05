class SalesPage {
    static async init(container) {
        const template = document.getElementById('template-ventas');
        if (!template) {
            console.error('Template template-ventas no encontrado');
            return;
        }
        
        container.innerHTML = '';
        container.appendChild(template.content.cloneNode(true));
        
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Punto de Venta (POS)';
        
        const controller = new SalesController();
        controller.init();
    }
}
window.SalesPage = SalesPage;
