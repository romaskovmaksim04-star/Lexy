import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = { title: "Условия использования" };

export default function Terms() {
  return (
    <DocPage title="Условия использования" updated="21 октября 2026">
      <DocSection title="Что такое GoLexi">
        <p>GoLexi — онлайн-платформа для подготовки к экзамену IELTS: тренажёры Listening, Reading, Writing и Speaking, словарь, план занятий и голосовой собеседник Lexi. Задания авторские и сделаны в формате экзамена. GoLexi не связан с British Council, IDP и Cambridge University Press & Assessment и не является официальным центром IELTS.</p>
      </DocSection>
      <DocSection title="Оценки">
        <p>Баллы за Writing и Speaking выставляются автоматически по измеримым признакам ответа и критериям IELTS. Это ориентир для тренировки, а не официальная оценка экзаменатора. Реальный балл на экзамене может отличаться.</p>
      </DocSection>
      <DocSection title="Аккаунт">
        <p>Аккаунт личный: не передавай доступ другим людям. Ты отвечаешь за сохранность пароля. Мы можем ограничить доступ, если аккаунт используется для автоматических запросов или чтобы нарушить работу сервиса.</p>
      </DocSection>
      <DocSection title="Тарифы и оплата">
        <p>Бесплатный тариф доступен без оплаты с дневными ограничениями. Pro и Pro+ оплачиваются помесячно, разовым платежом, без автоматического продления. Цены указаны на странице <Link href="/pricing" className="font-semibold underline">тарифов</Link>. Возвраты описаны в <Link href="/refund" className="font-semibold underline">политике возврата</Link>.</p>
      </DocSection>
      <DocSection title="Контент">
        <p>Тексты, аудио и задания на платформе принадлежат GoLexi. Их нельзя копировать и распространять без разрешения. Твои эссе и ответы остаются твоими, мы используем их только чтобы показать разбор и статистику.</p>
      </DocSection>
      <DocSection title="Изменения">
        <p>Мы можем обновлять эти условия. О существенных изменениях предупредим заранее на сайте или по email.</p>
      </DocSection>
      <DocSection title="Связь">
        <p>Вопросы по условиям можно задать через <Link href="/support" className="font-semibold underline">форму поддержки</Link>.</p>
      </DocSection>
    </DocPage>
  );
}
