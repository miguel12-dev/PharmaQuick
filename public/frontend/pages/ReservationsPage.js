class ReservationsPage {
    static async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        LayoutHelper.render(container, 'reservas');

        const template = document.getElementById('template-reservas');
        if (!template) {
            console.error('Template template-reservas no encontrado');
            return;
        }

        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = '';
            pageContent.appendChild(template.content.cloneNode(true));
        }

        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Reservas';

        const controller = new ReservationController();
        await controller.init();
    }

}

window.ReservationsPage = ReservationsPage;
